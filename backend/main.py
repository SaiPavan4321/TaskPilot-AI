from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
import uvicorn
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from .database import init_db
from .auth.routes import router as auth_router
from .routes.tasks import router as tasks_router
from .routes.habits import router as habits_router
from .routes.ai import router as ai_router
from .routes.analytics import router as analytics_router
from .routes.settings import router as settings_router

app = FastAPI(title="TASKPILOT AI Backend", description="AI-powered productivity application")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    error_msgs = [f"{'.'.join(str(l) for l in err.get('loc', []))}: {err.get('msg')}" for err in errors]
    error_str = ", ".join(error_msgs)
    
    logger.error(f"Validation error for {request.method} {request.url}: {error_str}")
    logger.error(f"Body: {exc.body}")
    
    return JSONResponse(
        status_code=400,
        content={"detail": error_str}
    )

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")
app.include_router(habits_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(settings_router, prefix="/api")

from .services.gemini_key_manager import key_manager

@app.on_event("startup")
async def startup_event():
    await init_db()
    total = key_manager.total_keys()
    if total == 0:
        raise RuntimeError("No Gemini API keys configured. Set GEMINI_API_KEY_* in environment.")
    logger.info(f"Loaded {total} Gemini API keys successfully.")

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "TASKPILOT AI Backend is running"}

# Serve React App
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Prevent intercepting /api routes
        if full_path.startswith("api/"):
            return {"detail": "Not Found"}
            
        index_file = os.path.join(static_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"detail": "Frontend build not found."}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
