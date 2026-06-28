# TASKPILOT AI 🚀

TASKPILOT AI is an intelligent productivity companion designed to help users intelligently prioritize tasks, avoid missing deadlines, and build habits. It is powered by **Google Gemini AI**.

## Features
- **Smart Task Prioritization**: AI evaluates your deadlines and workload to prioritize effectively.
- **AI Schedule Generator**: Converts natural language into a day-by-day action plan.
- **Risk Prediction**: Warns you about tasks with a high risk of missing deadlines.
- **AI Chat Assistant**: Provides tailored productivity coaching and guidance.
- **Habit Tracker**: Build and maintain streaks for meaningful daily activities.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Framer Motion
- **Backend**: Python FastAPI
- **Database**: MongoDB (with local JSON fallback)
- **AI**: Google Gemini API

## Setup Instructions

### Environment Variables
Create a `.env` file based on `.env.example`:
```
MONGODB_URI= # Optional, defaults to local JSON fallback if empty
JWT_SECRET=supersecret
GEMINI_API_KEY= # Optional, defaults to simulator if empty
GOOGLE_CLIENT_ID= # Optional
```

### Run Locally (Docker)
Ensure Docker is running and run:
```bash
docker-compose up --build
```
The application will run at `http://localhost:8080`.

### Run Locally (Manual)
**1. Start the backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
**2. Start the frontend**
```bash
cd frontend
npm install
npm run dev
```

### Deploy to Google Cloud Run
1. Ensure you have the `gcloud` CLI installed and authenticated.
2. Build and push the container to Google Artifact Registry.
3. Deploy to Cloud Run:
```bash
gcloud run deploy taskpilot-ai \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="MONGODB_URI=your_uri,GEMINI_API_KEY=your_key,JWT_SECRET=your_secret"
```
