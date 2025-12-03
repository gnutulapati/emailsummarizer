# Summarized Email Notifier

An intelligent email notification system that summarizes emails using local AI (Pegasus), extracts important dates and events, classifies emails by importance, detects spam, and sends real-time updates via WebSockets. It uses the Google Gmail API for email access and offers two storage options: Firebase Firestore or local JSON storage.

## Features

### 1. Email Summarization

- Uses a local Pegasus AI model (`google/pegasus-xsum`) to generate concise summaries.
- Extracts the most important information from emails.

### 2. Smart Notifications & Updates

- **Real-time updates via WebSockets:** New summaries, classifications, and events are pushed to connected clients instantly.
- Classifies emails by importance (high, medium, low) and category (important, meeting, deadline, regular, spam).
- Filters out potential spam (based on classification).
- Adds visual indicators (emojis) based on email category.

### 3. Event Extraction

- Automatically identifies dates, meetings, and deadlines in emails.
- Stores extracted events alongside summaries.
- **Real-time calendar updates:** New events can be pushed to the frontend.

### 4. Email Classification

- Sorts emails by importance.
- Categorizes emails.
- Adds visual indicators.

### 5. API Integration

- FastAPI backend provides RESTful API endpoints and WebSocket support.
- Endpoints for retrieving stored summaries and specific email details.
- WebSocket endpoint (`/ws`) for real-time data streaming.

### 6. Modern Frontend Interface (React)

- Responsive web application built with React and Material UI.
- Real-time updates without page refreshes via WebSockets.
- Interactive dashboard and potential calendar views.

## System Architecture

### Backend Components

1.  **Authentication & Email Fetching (Gmail API)**
    - `auth.py`: Handles OAuth 2.0 authentication flow with Google using `credentials.json` and stores tokens in `token.json`.
    - `gmail_utils.py`: Uses the authenticated Gmail service to fetch email metadata and full content via the Gmail API.
2.  **Summarization (Local AI)**
    - `summarizer.py`: Uses the `transformers` library and the `google/pegasus-xsum` model to generate email summaries locally.
3.  **Classification & Analysis**
    - `email_classifier.py`: Classifies emails by importance and category.
    - `event_extractor.py`: Extracts dates, meetings, and deadlines.
4.  **Data Storage**
    - **Option 1: Firebase Firestore**
      - Stores generated summaries, classifications, events, and metadata, linked by Gmail message ID.
    - **Option 2: Local JSON Storage**
      - Stores the same data in a local JSON file for simpler setup and offline use.
5.  **API & Real-time Layer (FastAPI)**
    - `main.py`: Hosts the FastAPI application, WebSocket endpoint (`/ws`), and REST API endpoints (`/emails`, `/emails/{email_id}`). Manages the main processing loop: fetch -> check storage -> summarize/classify -> store -> broadcast.

### Frontend Components (React)

1.  **Dashboard**: Displays email summaries with priority/category, updated in real-time via WebSocket.
2.  **Calendar View**: Visual calendar showing extracted events, updated in real-time.
3.  **WebSocket Integration**: Listens for updates on the `/ws` endpoint and updates the UI accordingly.

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+ (for the frontend)
- Google Cloud Project:
  - Enable the **Gmail API**.
  - Create **OAuth 2.0 Credentials** for a **Desktop app** and download the `credentials.json` file. Place it in the project root directory.
- **For Firestore Storage Option (Optional)**:
  - Firebase Project:
    - Set up **Firestore** database in **Native Mode**.
    - Generate a **Service Account Key** (JSON file) for the Admin SDK. Place it in the project root directory.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/gnutulapati/emailsummarizer.git
    cd emailsummarizer
    ```

2.  **Install backend dependencies:**

    ```bash
    cd backend
    # Optional: Create and activate a virtual environment
    # python -m venv venv
    # source venv/bin/activate  # Linux/macOS
    # .\venv\Scripts\activate  # Windows

    pip install -r requirements.txt
    ```

    _Note: This includes `transformers`, `torch` (needed by transformers), and Firebase/Google libraries._

3.  **Install frontend dependencies:**

    ```bash
    cd ../frontend
    npm install
    ```

4.  **Set up Environment Variables:**

    - Navigate to the `backend` directory.
    - Create a file named `.env` by copying `.env.example` (if one exists) or creating it from scratch.
    - Edit `backend/.env` and fill in the values:

      ```dotenv
      # backend/.env

      # Storage Option (choose one)
      STORAGE_OPTION="local"  # Use "local" or "firestore"

      # Path for local storage JSON file (if using local storage)
      LOCAL_STORAGE_PATH="../email_summaries.json"

      # Firebase Settings (if using Firestore)
      # Path relative to the backend directory to your service account key
      FIREBASE_SERVICE_ACCOUNT_KEY_PATH="../your-firebase-service-account-key.json"
      # Name of the Firestore collection to store summaries
      FIRESTORE_COLLECTION="email_summaries"

      # Gmail API Settings
      # Path relative to the backend directory to your OAuth credentials
      GOOGLE_CREDENTIALS_PATH="../credentials.json"
      # Path relative to the backend directory where the auth token will be saved
      GOOGLE_TOKEN_PATH="../token.json"
      ```

    - **Important:** If using Firestore, replace `"../your-firebase-service-account-key.json"` with the actual relative path to your downloaded Firebase key file. Make sure `credentials.json` is in the project root.

5.  **Update `.gitignore`:**
    Ensure your `.gitignore` file (in the project root) includes credentials and other sensitive files.

### Running the Application

1.  **First Run (Authentication):**

    - The first time you run the backend, it will open a web browser window.
    - You need to log in to the Google account whose emails you want to process.
    - Grant the application permission to **"View your email messages and settings"** (read-only access).
    - After authorization, the browser will show a "Authentication successful" message, and a `token.json` file will be created in your project root. Subsequent runs will use this token.

2.  **Run the Backend:**

    ```bash
    cd backend
    uvicorn main:app --reload --port 8000
    ```

    - `--reload` is useful for development; remove it for production.

3.  **Run the Frontend:**
    ```bash
    cd frontend
    npm run dev
    ```
    - Access the frontend application, usually at `http://localhost:5173` (check the terminal output).

## Storage Options

### Option 1: Firebase Firestore (Cloud-based)

- Cloud-based storage that scales automatically
- Requires proper configuration of Firebase project and IAM permissions
- Offers real-time updates and multi-device access
- Set `STORAGE_OPTION="firestore"` in your `.env` file

### Option 2: Local JSON Storage (Simple)

- Stores summaries in a local JSON file
- No cloud configuration needed
- Works offline
- Good for development or single-device setups
- Set `STORAGE_OPTION="local"` in your `.env` file

## API Endpoints

- `GET /emails?limit={N}`: Gets the `N` most recent email summaries stored in the selected storage.
- `GET /emails/{email_id}`: Gets the stored summary and details for a specific email ID.
- `WebSocket /ws`: Establishes a real-time connection. The backend pushes new/updated summaries as JSON messages with `type: 'email_update'`.

## Troubleshooting

- **Authentication Errors:**
  - Ensure `credentials.json` is correct, in the project root, and listed in `.gitignore`.
  - If `token.json` becomes invalid (e.g., you revoked access), delete it and restart the backend to re-authenticate.
- **Summarization Errors / Slow Startup:**
  - The first time `summarizer.py` runs, it will download the Pegasus model (~2GB), which can take time.
  - Ensure you have enough RAM and disk space.
- **WebSocket Connection Issues:**
  - Verify the backend (`uvicorn`) is running.
  - Check browser console and backend logs for errors.

## See Also

For more detailed information about the technical approaches used in this project, see [APPROACHES.md](APPROACHES.md).
