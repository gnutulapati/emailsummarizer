import os
import asyncio
import json
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime
import logging

# --- Environment Setup --- #
script_dir = Path(__file__).resolve().parent
dotenv_path = script_dir / '.env'
if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)
    print(f"Loaded environment variables from: {dotenv_path}")
else:
    print(f"Warning: .env file not found at {dotenv_path}")

# --- Logging Setup --- #
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Storage Setup --- #
# Import the storage manager factory
from storage_manager import get_storage_manager

# Get the configured storage option
STORAGE_OPTION = os.getenv("STORAGE_OPTION", "local").lower()
logger.info(f"Configured storage option: {STORAGE_OPTION}")

# The following Firebase init code is kept for reference when using Firestore
# but will be skipped if STORAGE_OPTION is "local"
if STORAGE_OPTION == "firestore":
    # --- Firebase Setup --- #
    import firebase_admin
    from firebase_admin import credentials, firestore

    cred_path_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH")
    if not cred_path_str:
        raise ValueError("FIREBASE_SERVICE_ACCOUNT_KEY_PATH not set in .env")

    # Construct absolute path relative to backend dir
    cred_path = (script_dir / cred_path_str).resolve()

    if not cred_path.exists():
         raise FileNotFoundError(f"Firebase credentials file not found at: {cred_path}")

    # Check if Firebase app is already initialized to prevent errors
    APP_NAME = 'email_summarizer_backend'
    if APP_NAME not in firebase_admin._apps:
        try:
            cred = credentials.Certificate(str(cred_path))
            project_id = cred.project_id or "emailsummarizer-e34f2" # Fallback just in case
            print(f"DEBUG Firebase: Initializing Firebase Admin SDK for project ID: {project_id}")
            # Initialize WITHOUT databaseURL, just cred and project ID, but name the app
            firebase_admin.initialize_app(cred, {
                'projectId': project_id,
            }, name=APP_NAME)
            print(f"DEBUG Firebase: Firebase Admin SDK initialized with name: {APP_NAME}.")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
            raise # Stop execution if Firebase can't initialize
    else:
        print(f"DEBUG Firebase: Firebase Admin SDK app '{APP_NAME}' already initialized.")

# Get the appropriate storage manager
try:
    storage_manager = get_storage_manager()
    logger.info(f"Storage manager initialized successfully using {STORAGE_OPTION} mode.")
except Exception as e:
    logger.error(f"Failed to initialize storage manager: {e}")
    raise  # Stop execution if storage can't be initialized

# --- Application Imports --- #
# Use functions directly from gmail_utils
from gmail_utils import fetch_recent_emails, get_full_email_content
from summarizer import summarize_email, format_summary, initialize_model # Keep summarizer
from email_classifier import EmailClassifier # Keep classifier
from event_extractor import EventExtractor # Keep event extractor

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional

# --- FastAPI Setup --- #
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for simplicity, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Initialize Components --- #
# No need for GmailIMAP client anymore
initialize_model()  # Initialize the Pegasus summarizer model
classifier = EmailClassifier()
event_extractor = EventExtractor()

# --- WebSocket Connection Manager --- #
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        disconnected_sockets = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.warning(f"Failed to send message to websocket {connection.client}: {e}. Marking for removal.")
                disconnected_sockets.append(connection)

        # Clean up disconnected sockets after broadcast attempt
        for socket in disconnected_sockets:
            self.disconnect(socket)

manager = ConnectionManager()

# --- Helper Functions --- #
async def process_and_store_email(email_metadata: Dict) -> Optional[Dict]:
    """Processes a single email: check storage, fetch full if needed, summarize, classify, store."""
    email_id = email_metadata.get('id')
    if not email_id:
        logger.warning("Email metadata missing ID.")
        return None

    try:
        # 1. Check storage for existing summary
        if storage_manager.summary_exists(email_id):
            logger.info(f"Summary for email {email_id} found in storage.")
            # Return existing data
            stored_data = storage_manager.get_summary(email_id)
            if stored_data:
                stored_data['source'] = 'storage'  # Indicate data came from storage
                return stored_data
            else:
                logger.warning(f"Summary exists but could not be retrieved for email {email_id}")
                # Fall through to regenerate it
        
        logger.info(f"No summary for email {email_id} in storage. Processing...")
        # 2. Fetch full email content (needed for robust summarization/classification)
        full_email_data = get_full_email_content(email_id)
        if not full_email_data:
            logger.error(f"Failed to fetch full content for email {email_id}.")
            return None # Skip this email if full content fails

        # 3. Summarize
        summary = summarize_email(
            full_email_data.get('subject', ''),
            full_email_data.get('sender', ''),
            full_email_data.get('snippet', ''),
            full_email_data.get('body', '')
        )

        # 4. Classify & Enrich
        # Ensure classifier expects dict
        enriched_email = classifier.enrich_email_with_classification(full_email_data)
        category = enriched_email.get('category', 'Uncategorized')
        importance = enriched_email.get('importance', 0)
        icon = enriched_email.get('icon', '')

        # 5. Extract Events
        events_list = event_extractor.extract_events(full_email_data)
        events_data = [event.to_dict() for event in events_list]

        # 6. Prepare data for storage and API response
        processed_data = {
            'id': email_id,
            'threadId': full_email_data.get('threadId'),
            'subject': full_email_data.get('subject', ''),
            'sender': full_email_data.get('sender', ''),
            'date': full_email_data.get('date', datetime.now().isoformat()), # Use fetched date
            'snippet': full_email_data.get('snippet', ''),
            'summary': summary,
            'category': category,
            'importance': importance,
            'icon': icon,
            'events': events_data,
            'original_link': f"https://mail.google.com/mail/u/0/#inbox/{email_id}",
        }

        # 7. Store in the selected storage
        success = storage_manager.store_summary(email_id, processed_data)
        if success:
            logger.info(f"Stored summary for email {email_id} in {STORAGE_OPTION} storage.")
        else:
            logger.warning(f"Failed to store summary for email {email_id} in {STORAGE_OPTION} storage.")

        # Return data for immediate use
        api_response_data = processed_data.copy()
        api_response_data['processed_at'] = datetime.now().isoformat() # Add timestamp
        api_response_data['source'] = 'new'  # Indicate newly processed
        return api_response_data

    except Exception as e:
        logger.error(f"Error processing email {email_id}: {e}")
        return None

# --- WebSocket Endpoint --- #
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    logger.info(f"WebSocket connected: {websocket.client}")
    processed_ids_this_session = set() # Track IDs sent in this connection lifetime

    try:
        while True:
            # 1. Fetch recent email metadata (only IDs, basic headers, snippet)
            logger.info("Checking for new emails...")
            try:
                # Fetch only unread emails
                email_metadata_list = fetch_recent_emails(max_results=20, only_unread=True)
            except Exception as fetch_err:
                 logger.error(f"Error fetching email list from Gmail API: {fetch_err}")
                 email_metadata_list = [] # Continue loop, maybe connection will recover
                 await asyncio.sleep(15) # Shorter sleep on API error
                 continue

            processed_emails_for_broadcast = []
            if email_metadata_list:
                logger.info(f"Fetched {len(email_metadata_list)} email metadata items. Processing...")
                tasks = [process_and_store_email(meta) for meta in email_metadata_list]
                results = await asyncio.gather(*tasks)

                for result in results:
                    if result and result.get('id') not in processed_ids_this_session:
                        processed_emails_for_broadcast.append(result)
                        processed_ids_this_session.add(result['id']) # Add to sent set

            # Only broadcast if there are *new* processed emails to send
            if processed_emails_for_broadcast:
                # Sort emails by importance before broadcasting
                processed_emails_for_broadcast.sort(key=lambda x: x.get('importance', 0), reverse=True)
            
                logger.info(f"Broadcasting {len(processed_emails_for_broadcast)} new/updated summaries.")
                await manager.broadcast(json.dumps({
                    'type': 'email_update',
                    'data': processed_emails_for_broadcast
                }))
            else:
                logger.info("No new emails processed or all fetched emails were already sent.")
            
            # 3. Wait before checking again
            await asyncio.sleep(60) # Check every 60 seconds
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {websocket.client}")
    except Exception as e:
        logger.error(f"Error in WebSocket connection: {e}", exc_info=True)
        # Attempt to send error to client before disconnecting
        try:
            await websocket.send_text(json.dumps({'type': 'error', 'message': f"Server error: {e}"}))
        except Exception:
            pass # Ignore if sending fails
    finally:
        manager.disconnect(websocket)
        logger.info(f"WebSocket cleanup complete for: {websocket.client}")

# --- API Endpoints --- #
@app.get("/emails", response_model=List[Dict])
async def get_emails(limit: int = 20):
    """Gets recently processed email summaries from storage."""
    try:
        processed_emails = storage_manager.get_recent_summaries(limit)
        
        # Sort by importance if needed after retrieval
        processed_emails.sort(key=lambda x: x.get('importance', 0), reverse=True)
        return processed_emails

    except Exception as e:
        logger.error(f"Error fetching emails from storage: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve email summaries")

@app.get("/emails/{email_id}", response_model=Dict)
async def get_email_details(email_id: str):
    """Gets the stored summary details for a specific email ID from storage."""
    try:
        data = storage_manager.get_summary(email_id)
        
        if data:
            return data
        else:
            # If not in storage, try fetching from Gmail API and processing
            logger.info(f"Email {email_id} not found in storage. Attempting to fetch and process it.")
            full_email_data = get_full_email_content(email_id)
            
            if not full_email_data:
                raise HTTPException(status_code=404, detail="Email not found in Gmail.")
                
            # Process it immediately
            processed_data = await process_and_store_email(full_email_data)
            
            if processed_data:
                return processed_data
            else:
                raise HTTPException(status_code=500, detail="Failed to process email content.")

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error fetching email details for {email_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve email details")

# --- Main Execution --- #
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    logger.info(f"Starting Uvicorn server on 0.0.0.0:{port}")
    # Consider adding reload=True for development, but remove for production
    uvicorn.run(app, host="0.0.0.0", port=port)