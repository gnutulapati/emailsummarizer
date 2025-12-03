# Intelligent Email Summarizer & Notifier - Project Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Installation Guide](#installation-guide)
4. [Configuration](#configuration)
5. [API Documentation](#api-documentation)
6. [Frontend Components](#frontend-components)
7. [Storage Management](#storage-management)
8. [Deployment Guide](#deployment-guide)
9. [Troubleshooting](#troubleshooting)
10. [Development Guidelines](#development-guidelines)

## Project Overview

### Description

The Intelligent Email Summarizer & Notifier is a comprehensive email management system that leverages local AI processing to automatically summarize emails, extract important events, and provide real-time notifications. The system prioritizes data privacy by processing all emails locally without sending data to external services.

### Key Features

- **Local AI Summarization**: Uses Google's Pegasus model for intelligent email summarization
- **Real-time Notifications**: WebSocket-based instant updates and notifications
- **Event Extraction**: Automatically identifies meetings, deadlines, and important dates
- **Email Classification**: Categorizes emails by importance and type
- **Flexible Storage**: Supports both local JSON and cloud Firestore storage
- **Responsive Web Interface**: Modern React-based dashboard with Material UI
- **Gmail Integration**: Secure OAuth 2.0 integration with Gmail API

### Technology Stack

#### Backend
- **FastAPI**: Modern Python web framework
- **Gmail API**: Official Google email API
- **Transformers**: Hugging Face library for AI models
- **Pegasus**: Google's abstractive summarization model
- **WebSocket**: Real-time communication protocol

#### Frontend
- **React 18**: Modern JavaScript framework
- **Material UI**: Component library
- **WebSocket Client**: Real-time communication
- **Date-fns**: Date manipulation utilities

#### Storage
- **Local JSON**: File-based storage
- **Firebase Firestore**: Cloud NoSQL database

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Dashboard     │  │   Email Cards   │  │   Reminders     │ │
│  │   (React)       │  │   (Material UI) │  │   (Events)      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │ WebSocket + REST API
┌─────────────────────▼───────────────────────────────────────────┐
│                    Backend Services                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   FastAPI       │  │   Gmail API     │  │   AI Engine     │ │
│  │   Server        │  │   Integration   │  │   (Pegasus)     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Email         │  │   Event         │  │   Notification  │ │
│  │   Classifier    │  │   Extractor     │  │   System        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Storage Interface
┌─────────────────────▼───────────────────────────────────────────┐
│                    Storage Layer                               │
│  ┌─────────────────┐                    ┌─────────────────┐    │
│  │   Local JSON    │                    │   Firebase      │    │
│  │   Storage       │                    │   Firestore     │    │
│  └─────────────────┘                    └─────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Component Details

#### Backend Components

1. **Main Application (`main.py`)**
   - FastAPI server setup
   - WebSocket endpoint management
   - REST API endpoints
   - Email processing pipeline

2. **Authentication (`auth.py`)**
   - OAuth 2.0 flow management
   - Gmail API service initialization
   - Token management and refresh

3. **Gmail Integration (`gmail_utils.py`)**
   - Email fetching and parsing
   - Header decoding
   - Content extraction

4. **AI Summarization (`summarizer.py`)**
   - Pegasus model initialization
   - Email summarization logic
   - Text preprocessing

5. **Email Classification (`email_classifier.py`)**
   - Importance scoring
   - Category classification
   - Spam detection

6. **Event Extraction (`event_extractor.py`)**
   - Date pattern recognition
   - Meeting detection
   - Deadline identification

7. **Storage Management (`storage_manager.py`)**
   - Storage abstraction layer
   - Local JSON implementation
   - Firestore implementation

#### Frontend Components

1. **Dashboard (`Dashboard.jsx`)**
   - Main application interface
   - Email list display
   - Real-time updates

2. **Email Card (`EmailCard.jsx`)**
   - Individual email display
   - Importance indicators
   - Action buttons

3. **Reminder List (`ReminderList.jsx`)**
   - Event display
   - Date formatting
   - Navigation integration

4. **WebSocket Context (`WebSocketContext.jsx`)**
   - Real-time communication
   - Connection management
   - Message handling

## Installation Guide

### Prerequisites

- **Python 3.9+**
- **Node.js 16+**
- **Google Cloud Project** (for Gmail API access)
- **Firebase Project** (optional, for cloud storage)

### Backend Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd summarized-email-notifier
   ```

2. **Create Virtual Environment**
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/macOS
   source venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Gmail API Setup**
   - Create a Google Cloud Project
   - Enable the Gmail API
   - Create OAuth 2.0 credentials for a desktop application
   - Download `credentials.json` and place in project root

5. **Firebase Setup (Optional)**
   - Create a Firebase project
   - Enable Firestore in Native Mode
   - Generate a service account key
   - Download the JSON file and place in project root

### Frontend Installation

1. **Install Node.js Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Vite (if needed)**
   ```bash
   # The vite.config.js should already be configured
   npm run dev
   ```

## Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Storage Configuration
STORAGE_OPTION="local"  # Options: "local" or "firestore"
LOCAL_STORAGE_PATH="../email_summaries.json"

# Firebase Configuration (if using Firestore)
FIREBASE_SERVICE_ACCOUNT_KEY_PATH="../your-firebase-key.json"
FIRESTORE_COLLECTION="email_summaries"

# Gmail API Configuration
GOOGLE_CREDENTIALS_PATH="../credentials.json"
GOOGLE_TOKEN_PATH="../token.json"

# Server Configuration
PORT=8000
```

### Google Cloud Setup

1. **Enable APIs**
   - Gmail API
   - Google Calendar API (optional)

2. **OAuth Consent Screen**
   - Configure OAuth consent screen
   - Add test users (for development)

3. **Credentials**
   - Create OAuth 2.0 Client ID
   - Download credentials JSON

### Firebase Setup (Optional)

1. **Project Creation**
   - Create new Firebase project
   - Enable Firestore Database

2. **Service Account**
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Download JSON file

3. **Database Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## API Documentation

### REST Endpoints

#### Get Recent Emails
```http
GET /emails?limit={number}
```

**Parameters:**
- `limit` (optional): Number of emails to retrieve (default: 20)

**Response:**
```json
[
  {
    "id": "email_id",
    "subject": "Email Subject",
    "sender": "sender@example.com",
    "date": "2025-01-01T12:00:00Z",
    "summary": "AI-generated summary",
    "category": "important",
    "importance": 3,
    "icon": "⚠️",
    "events": [
      {
        "event_type": "meeting",
        "description": "Team meeting",
        "date_str": "2025-01-02T10:00:00Z",
        "confidence": 0.8
      }
    ]
  }
]
```

#### Get Email Details
```http
GET /emails/{email_id}
```

**Response:**
```json
{
  "id": "email_id",
  "subject": "Email Subject",
  "sender": "sender@example.com",
  "body": "Full email content",
  "summary": "AI-generated summary",
  "events": [...],
  "category": "important",
  "importance": 3
}
```

### WebSocket Endpoint

#### Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
```

#### Message Format
```json
{
  "type": "email_update",
  "data": [
    {
      "id": "email_id",
      "subject": "New Email",
      "summary": "Summary text",
      "importance": 3
    }
  ]
}
```

#### Message Types
- `email_update`: New or updated emails
- `error`: Error notifications
- `ping`: Connection keep-alive

## Frontend Components

### Dashboard Component

The main dashboard displays emails and reminders in a responsive layout.

**Props:**
- None (uses WebSocket context)

**Features:**
- Real-time email updates
- Email filtering by priority
- Responsive design
- Event integration

### EmailCard Component

Displays individual email information with actions.

**Props:**
```javascript
{
  email: {
    id: string,
    subject: string,
    sender: string,
    date: string,
    summary: string,
    importance: number,
    category: string,
    icon: string
  },
  onClick: function
}
```

**Features:**
- Importance-based styling
- Click navigation
- Visual indicators
- Responsive layout

### ReminderList Component

Shows upcoming events and reminders from emails.

**Props:**
```javascript
{
  eventsData: Array,
  limit: number,
  showTitle: boolean
}
```

**Features:**
- Date-based filtering
- Importance indicators
- Click navigation to source email
- Real-time updates

### WebSocket Context

Manages real-time communication with the backend.

**Methods:**
- `connectWebSocket()`: Establish connection
- `sendMessage(message)`: Send data to server
- `reconnect()`: Manual reconnection

**State:**
- `connected`: Connection status
- `messages`: Message history
- `newEmails`: Latest email updates
- `newEvents`: Latest event updates

## Storage Management

### Storage Abstraction Layer

The system uses an abstraction layer to support multiple storage backends:

```python
class StorageManager(abc.ABC):
    @abc.abstractmethod
    def store_summary(self, email_id: str, summary_data: Dict) -> bool:
        pass
    
    @abc.abstractmethod
    def get_summary(self, email_id: str) -> Optional[Dict]:
        pass
    
    @abc.abstractmethod
    def get_recent_summaries(self, limit: int) -> List[Dict]:
        pass
    
    @abc.abstractmethod
    def summary_exists(self, email_id: str) -> bool:
        pass
```

### Local JSON Storage

**Advantages:**
- Simple setup
- No external dependencies
- Offline functionality
- Easy debugging

**Disadvantages:**
- Single-device limitation
- No automatic backup
- Limited scalability

**Implementation:**
```python
class JSONStorageManager(StorageManager):
    def __init__(self, file_path: str):
        self.file_path = Path(file_path).resolve()
        self._ensure_file_exists()
    
    def store_summary(self, email_id: str, summary_data: Dict) -> bool:
        data = self._read_data()
        data[email_id] = summary_data
        return self._write_data(data)
```

### Firebase Firestore Storage

**Advantages:**
- Cloud-based access
- Automatic scaling
- Real-time updates
- Multi-device sync

**Disadvantages:**
- Requires internet connection
- Setup complexity
- Potential costs

**Implementation:**
```python
class FirestoreStorageManager(StorageManager):
    def __init__(self, db, collection_name: str):
        self.db = db
        self.collection = db.collection(collection_name)
    
    def store_summary(self, email_id: str, summary_data: Dict) -> bool:
        doc_ref = self.collection.document(email_id)
        doc_ref.set(summary_data)
        return True
```

## Deployment Guide

### Development Deployment

1. **Start Backend Server**
   ```bash
   cd backend
   uvicorn main:app --reload --port 8000
   ```

2. **Start Frontend Server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Production Deployment

#### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM python:3.9-slim
   
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install -r requirements.txt
   
   COPY . .
   EXPOSE 8000
   
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

2. **Build and Run**
   ```bash
   docker build -t email-summarizer .
   docker run -p 8000:8000 email-summarizer
   ```

#### Cloud Deployment

1. **Google Cloud Platform**
   - Use Cloud Run for containerized deployment
   - Configure Cloud SQL for database
   - Set up Cloud Storage for files

2. **AWS Deployment**
   - Use ECS or Lambda for backend
   - Configure RDS for database
   - Set up S3 for file storage

3. **Heroku Deployment**
   - Use Procfile for process management
   - Configure environment variables
   - Set up add-ons for database

### Environment Configuration

**Production Environment Variables:**
```env
# Storage
STORAGE_OPTION="firestore"
FIRESTORE_COLLECTION="email_summaries_prod"

# Security
SECRET_KEY="your-secret-key"
CORS_ORIGINS="https://yourdomain.com"

# Performance
WORKERS=4
TIMEOUT=30
```

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

**Problem:** Gmail API authentication fails
**Solutions:**
- Verify `credentials.json` is in correct location
- Check OAuth consent screen configuration
- Ensure Gmail API is enabled
- Delete `token.json` and re-authenticate

#### 2. Firestore Connection Issues

**Problem:** Cannot connect to Firestore
**Solutions:**
- Verify service account key file path
- Check IAM permissions
- Ensure Firestore is enabled
- Switch to local storage as fallback

#### 3. WebSocket Connection Problems

**Problem:** Frontend cannot connect to WebSocket
**Solutions:**
- Check backend server is running
- Verify WebSocket URL in frontend
- Check firewall settings
- Review browser console for errors

#### 4. AI Model Loading Issues

**Problem:** Pegasus model fails to load
**Solutions:**
- Ensure sufficient RAM (4GB+ recommended)
- Check internet connection for model download
- Verify transformers library version
- Clear model cache and re-download

#### 5. Email Processing Errors

**Problem:** Emails not being processed
**Solutions:**
- Check Gmail API quotas
- Verify email permissions
- Review backend logs
- Test with different email accounts

### Performance Optimization

#### Backend Optimization
- Use connection pooling for database
- Implement caching for frequently accessed data
- Optimize AI model parameters
- Use async processing for heavy operations

#### Frontend Optimization
- Implement virtual scrolling for large lists
- Use React.memo for component optimization
- Optimize bundle size with code splitting
- Implement proper error boundaries

#### Database Optimization
- Create appropriate indexes
- Implement data archiving
- Use pagination for large datasets
- Optimize query patterns

## Development Guidelines

### Code Style

#### Python
- Follow PEP 8 guidelines
- Use type hints
- Write comprehensive docstrings
- Implement proper error handling

#### JavaScript/React
- Follow ESLint configuration
- Use functional components with hooks
- Implement proper prop types
- Write unit tests for components

### Testing

#### Backend Testing
```python
# Unit tests for individual functions
def test_summarize_email():
    result = summarize_email("Test subject", "sender", "snippet", "body")
    assert isinstance(result, str)
    assert len(result) > 0

# Integration tests for API endpoints
def test_get_emails_endpoint():
    response = client.get("/emails")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
```

#### Frontend Testing
```javascript
// Component testing with React Testing Library
import { render, screen } from '@testing-library/react';
import EmailCard from './EmailCard';

test('renders email card with correct information', () => {
  const mockEmail = {
    id: '1',
    subject: 'Test Email',
    sender: 'test@example.com',
    summary: 'Test summary'
  };
  
  render(<EmailCard email={mockEmail} />);
  expect(screen.getByText('Test Email')).toBeInTheDocument();
});
```

### Git Workflow

1. **Branch Naming**
   - Feature branches: `feature/description`
   - Bug fixes: `fix/description`
   - Hotfixes: `hotfix/description`

2. **Commit Messages**
   - Use conventional commits format
   - Include issue numbers when applicable
   - Write descriptive commit messages

3. **Pull Request Process**
   - Create descriptive PR titles
   - Include detailed descriptions
   - Link related issues
   - Request appropriate reviewers

### Documentation Standards

1. **Code Documentation**
   - Write clear docstrings for functions
   - Include parameter and return type information
   - Provide usage examples
   - Document complex algorithms

2. **API Documentation**
   - Use OpenAPI/Swagger specifications
   - Include request/response examples
   - Document error codes and messages
   - Provide authentication details

3. **User Documentation**
   - Write clear setup instructions
   - Include troubleshooting sections
   - Provide configuration examples
   - Update documentation with changes

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Maintainer**: Development Team  
**Repository**: [Project Repository URL]