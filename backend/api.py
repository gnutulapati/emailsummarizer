from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Dict, Optional, Set
import os
import asyncio
import json
import time

# Import core utilities
from auth import get_gmail_service
from gmail_utils import fetch_recent_emails
from summarizer import summarize_email, format_summary

# Handle optional imports - if these fail, provide stub implementations
try:
    from email_classifier import classify_email, sort_emails_by_importance, enrich_email_with_classification
except ImportError:
    # Provide stub implementations of these functions
    def classify_email(email_data): return {"category": "unknown", "importance": 2}
    def sort_emails_by_importance(emails): return emails
    def enrich_email_with_classification(email): 
        email["category"] = "unknown"
        email["importance"] = 2
        return email

try:
    from event_extractor import extract_events_from_email, get_upcoming_events, get_todays_events, get_tomorrows_events
except ImportError:
    # Provide stub implementations
    def extract_events_from_email(email): return []
    def get_upcoming_events(events): return []
    def get_todays_events(events): return []
    def get_tomorrows_events(events): return []

try:
    from notifier import send_push_notification, send_event_notification, notify_important_email
except ImportError:
    # Provide stub implementations
    def send_push_notification(*args, **kwargs): return {"success": False, "error": "Notification module not available"}
    def send_event_notification(*args, **kwargs): return {"success": False, "error": "Notification module not available"}
    def notify_important_email(*args, **kwargs): return {"success": False, "error": "Notification module not available"}

app = FastAPI(title="Email Notifier API")

# Models for API requests and responses
class DeviceRegistration(BaseModel):
    device_token: str
    user_id: Optional[str] = None
    device_name: Optional[str] = None

class EmailResponse(BaseModel):
    id: str
    subject: Optional[str] = None
    sender: Optional[str] = None
    snippet: Optional[str] = None
    summary: Optional[str] = None
    category: Optional[str] = None
    importance: Optional[int] = None
    icon: Optional[str] = None

class EventResponse(BaseModel):
    event_type: str
    description: str
    date_str: Optional[str] = None
    is_today: bool = False
    is_tomorrow: bool = False
    days_until: Optional[int] = None
    formatted_date: Optional[str] = None

class NotificationRequest(BaseModel):
    device_token: str
    title: str
    message: str
    data: Optional[Dict] = None

# In-memory storage for device tokens (in production, use a database)
device_tokens = set()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)
            
    async def broadcast_json(self, data: dict):
        json_data = json.dumps(data)
        await self.broadcast(json_data)

manager = ConnectionManager()

# Routes
@app.get("/")
async def root():
    return {"message": "Email Notifier API is running"}

@app.post("/register-device")
async def register_device(registration: DeviceRegistration):
    """Register a device for push notifications"""
    device_tokens.add(registration.device_token)
    return {"status": "success", "message": "Device registered successfully"}

@app.get("/emails", response_model=List[EmailResponse])
async def get_emails(max_results: int = 10):
    """Get recent emails with classification and summaries"""
    try:
        emails = fetch_recent_emails(max_results=max_results)
        
        result = []
        for email in emails:
            # Generate summary
            summary = summarize_email(email['subject'], email['from'], email['snippet'], email['snippet'])
            
            # Classify and enrich email
            enriched = enrich_email_with_classification(email)
            enriched['summary'] = summary
            
            # Convert to response format
            response = EmailResponse(
                id=email['id'],
                subject=email['subject'],
                sender=email['from'],
                snippet=email['snippet'],
                summary=summary,
                category=enriched.get('category'),
                importance=enriched.get('importance'),
                icon=enriched.get('icon')
            )
            result.append(response)
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/emails/important", response_model=List[EmailResponse])
async def get_important_emails(max_results: int = 10):
    """Get important emails only"""
    try:
        service = get_gmail_service()
        emails = fetch_recent_emails(service, max_results=max_results)
        
        result = []
        for email in emails:
            # Classify email
            category, importance = classify_email(email)
            
            # Only include important emails
            if importance >= 2:  # Medium or high importance
                # Generate summary
                summary = summarize_email(email['subject'], email['from'], email['snippet'], email['snippet'])
                
                # Enrich email
                enriched = enrich_email_with_classification(email)
                enriched['summary'] = summary
                
                # Convert to response format
                response = EmailResponse(
                    id=email['id'],
                    subject=email['subject'],
                    sender=email['from'],
                    snippet=email['snippet'],
                    summary=summary,
                    category=enriched.get('category'),
                    importance=enriched.get('importance'),
                    icon=enriched.get('icon')
                )
                result.append(response)
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/events", response_model=List[EventResponse])
async def get_events(days_ahead: int = 7, max_emails: int = 20):
    """Extract events from recent emails"""
    try:
        service = get_gmail_service()
        emails = fetch_recent_emails(service, max_results=max_emails)
        
        all_events = []
        for email in emails:
            events = extract_events_from_email(email)
            all_events.extend(events)
        
        # Get upcoming events
        upcoming = get_upcoming_events(all_events, days_ahead=days_ahead)
        
        # Convert to response format
        result = []
        for event in upcoming:
            response = EventResponse(
                event_type=event.event_type,
                description=event.description,
                date_str=event.date_str,
                is_today=event.is_today,
                is_tomorrow=event.is_tomorrow,
                days_until=event.days_until,
                formatted_date=event.to_dict().get('formatted_date')
            )
            result.append(response)
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/events/today", response_model=List[EventResponse])
async def get_todays_events(max_emails: int = 20):
    """Get events scheduled for today"""
    try:
        service = get_gmail_service()
        emails = fetch_recent_emails(service, max_results=max_emails)
        
        all_events = []
        for email in emails:
            events = extract_events_from_email(email)
            all_events.extend(events)
        
        # Get today's events
        today = get_todays_events(all_events)
        
        # Convert to response format
        result = []
        for event in today:
            response = EventResponse(
                event_type=event.event_type,
                description=event.description,
                date_str=event.date_str,
                is_today=event.is_today,
                is_tomorrow=event.is_tomorrow,
                days_until=event.days_until,
                formatted_date=event.to_dict().get('formatted_date')
            )
            result.append(response)
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/notify")
async def send_notification(notification: NotificationRequest):
    """Send a push notification to a device"""
    try:
        send_push_notification(
            device_token=notification.device_token,
            title=notification.title,
            message=notification.message,
            data=notification.data
        )
        return {"status": "success", "message": "Notification sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/check-and-notify")
async def check_and_notify(background_tasks: BackgroundTasks):
    """Check for important emails and events and send notifications"""
    try:
        # Add the notification task to background tasks
        background_tasks.add_task(process_and_notify)
        return {"status": "success", "message": "Background task started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        print(f"WebSocket client connected: {websocket.client}")
        await websocket.send_json({"type": "connection_established", "status": "ok"})
        
        while True:
            try:
                # Wait for any message
                data = await websocket.receive_text()
                print(f"Received message: {data}")
                
                # Process different message types
                try:
                    message = json.loads(data)
                    if message.get("type") == "ping":
                        await websocket.send_json({"type": "pong", "timestamp": time.time()})
                except json.JSONDecodeError:
                    pass  # Not JSON, just echo it back
                
                # Echo the message back for testing
                await websocket.send_json({
                    "type": "echo",
                    "data": data,
                    "timestamp": time.time()
                })
            except Exception as e:
                print(f"Error handling WebSocket message: {str(e)}")
                # Continue the loop rather than breaking on error
                continue
                
    except WebSocketDisconnect:
        print(f"WebSocket client disconnected: {websocket.client}")
        manager.disconnect(websocket)
    except Exception as e:
        print(f"Unexpected WebSocket error: {str(e)}")
        manager.disconnect(websocket)

@app.post("/process-email")
async def process_new_email(background_tasks: BackgroundTasks):
    """Process new emails and send real-time updates via WebSocket"""
    background_tasks.add_task(process_and_broadcast_email)
    return {"status": "success", "message": "Processing emails in background"}

async def process_and_broadcast_email():
    """Process new emails and broadcast updates via WebSocket"""
    try:
        service = get_gmail_service()
        emails = fetch_recent_emails(service, max_results=5)
        
        all_events = []
        processed_emails = []
        
        for email in emails:
            # Generate summary
            summary = summarize_email(email['subject'], email['from'], email['snippet'], email['snippet'])
            
            # Classify and enrich email
            enriched = enrich_email_with_classification(email)
            enriched['summary'] = summary
            
            # Extract events
            events = extract_events_from_email(email)
            if events:
                for event in events:
                    all_events.append(event.to_dict())
            
            # Convert to broadcast format
            email_data = {
                "id": email['id'],
                "subject": email['subject'],
                "sender": email['from'],
                "snippet": email['snippet'],
                "summary": summary,
                "category": enriched.get('category'),
                "importance": enriched.get('importance'),
                "icon": enriched.get('icon')
            }
            processed_emails.append(email_data)
        
        # Broadcast new emails to all connected clients
        if processed_emails:
            await manager.broadcast_json({
                "type": "new_emails",
                "data": processed_emails
            })
        
        # Broadcast events if any were found
        if all_events:
            today_events = [event for event in all_events if event.get('is_today', False)]
            tomorrow_events = [event for event in all_events if event.get('is_tomorrow', False)]
            
            await manager.broadcast_json({
                "type": "new_events",
                "data": {
                    "all_events": all_events,
                    "today_events": today_events,
                    "tomorrow_events": tomorrow_events
                }
            })
    except Exception as e:
        print(f"Error processing emails: {str(e)}")

# Setup background task to periodically check for new emails
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(periodic_email_check())

async def periodic_email_check():
    """Periodically check for new emails and broadcast updates"""
    while True:
        await process_and_broadcast_email()
        # Check every 2 minutes
        await asyncio.sleep(120)

async def process_and_notify():
    """Process emails and send notifications for important ones"""
    try:
        service = get_gmail_service()
        emails = fetch_recent_emails(service, max_results=10)
        
        for device_token in device_tokens:
            for email in emails:
                # Check importance
                category, importance = classify_email(email)
                
                if importance >= 2:  # Medium or high importance
                    notify_important_email(device_token, email)
                
                # Extract and notify about events
                events = extract_events_from_email(email)
                today_events = get_todays_events(events)
                tomorrow_events = get_tomorrows_events(events)
                
                # Notify about today's events
                for event in today_events:
                    send_event_notification(
                        device_token=device_token,
                        event_type=event.event_type,
                        event_details=event.description,
                        email_subject=email.get('subject', ''),
                        email_sender=email.get('from', ''),
                        event_date=event.date_str
                    )
                
                # Notify about tomorrow's events
                for event in tomorrow_events:
                    send_event_notification(
                        device_token=device_token,
                        event_type=event.event_type,
                        event_details=event.description,
                        email_subject=email.get('subject', ''),
                        email_sender=email.get('from', ''),
                        event_date=event.date_str
                    )
    except Exception as e:
        print(f"Error in background task: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)