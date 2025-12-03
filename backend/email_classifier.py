import re
from typing import Dict, List, Tuple, Optional
from dateutil import parser as date_parser
import datetime

# --- Constants --- #

# Importance Levels
IMPORTANCE_HIGH = 3
IMPORTANCE_MEDIUM = 2
IMPORTANCE_LOW = 1

# Categories for email classification
CATEGORY_IMPORTANT = "important"
CATEGORY_MEETING = "meeting"
CATEGORY_DEADLINE = "deadline"
CATEGORY_REGULAR = "regular"
CATEGORY_SPAM = "spam"

# Keywords and Patterns for Classification
IMPORTANT_KEYWORDS = [
    r'\b(urgent|important|action required|asap|critical)\b',
    r'\b(respond by|reply by|due date)\b',
    r'\b(invoice|payment due|bill)\b'
]

MEETING_PATTERNS = [
    r'invitation:.*@.*\b',
    r'\b(meeting|call|conference|zoom|google meet|teams meeting)\b',
    r'\b(schedule|calendar|appointment)\b'
]

DEADLINE_PATTERNS = [
    r'\b(deadline|due by|submit by|due on)\b',
    r'\b(final submission|project due)\b'
]

SPAM_PATTERNS = [
    r'\b(win prize|free gift|limited time offer|unsubscribe)\b',
    r'\b(click here|buy now|viagra|cialis|loan)\b',
    r'[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b' # Simple check for multiple emails
]

DATE_PATTERNS = [
    # Common date formats (YYYY-MM-DD, MM/DD/YYYY, DD-Mon-YYYY, etc.)
    r'\b\d{4}-\d{1,2}-\d{1,2}\b', 
    r'\b\d{1,2}/\d{1,2}/\d{2,4}\b', 
    r'\b\d{1,2}-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2,4}\b',
    # Month names
    r'\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(st|nd|rd|th)?(,\s*\d{4})?\b',
    # Days of the week + relative days
    r'\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b',
    r'\b(today|tomorrow|yesterday)\b',
    # Time formats (HH:MM, HHam/pm)
    r'\b\d{1,2}:\d{2}(\s*(am|pm))?\b'
]

# --- Helper Functions (previously in notifier) --- #

def extract_dates(text: str) -> List[str]:
    """Extract potential date mentions from text"""
    dates = []
    for pattern in DATE_PATTERNS:
        # Findall returns list of strings or list of tuples if pattern has groups
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if isinstance(match, tuple):
                # If groups are present, findall returns tuples. Take the first group or reconstruct.
                # For DATE_PATTERNS, the full match is usually what we want.
                # We need to find the full match string, not just the groups.
                # Let's use finditer instead for more control.
                pass # Re-implement using finditer below
            else:
                dates.append(match)

    # Re-implement using finditer to reliably get the full matched string
    dates = []
    for pattern in DATE_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            dates.append(match.group(0))

    # Basic parsing attempt to filter out unlikely matches
    valid_dates = []
    for date_str in dates:
        try:
            date_parser.parse(str(date_str), fuzzy=True)
            valid_dates.append(str(date_str))
        except (ValueError, TypeError):
            pass # Ignore strings that can't be parsed as dates
    return valid_dates

def extract_meetings(text: str) -> List[str]:
    """Extract potential meeting mentions from text"""
    meetings = []
    for pattern in MEETING_PATTERNS:
        # Using finditer to get full match strings reliably
        for match in re.finditer(pattern, text, re.IGNORECASE):
            meetings.append(match.group(0))
    return meetings

def extract_deadlines(text: str) -> List[str]:
    """Extract potential deadline mentions from text"""
    deadlines = []
    for pattern in DEADLINE_PATTERNS:
        # Using finditer to get full match strings reliably
        for match in re.finditer(pattern, text, re.IGNORECASE):
            deadlines.append(match.group(0))
    return deadlines

def detect_spam(subject: str, body: str, sender: str) -> bool:
    """Detect potential spam based on keywords and patterns"""
    text = f"{subject} {body}"
    spam_score = 0
    for pattern in SPAM_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            spam_score += 1
    # Simple heuristic: 2 or more spam indicators = spam
    # Add more sophisticated checks if needed (e.g., sender domain, specific phrases)
    return spam_score >= 2

# --- Email Classifier Class --- #

class EmailClassifier:
    def classify_email(self, email_data: Dict) -> Tuple[str, int]:
        """
        Classify an email into a category and importance level
        
        Returns:
            Tuple of (category, importance_level)
        """
        subject = email_data.get("subject", "")
        sender = email_data.get("from", "")
        snippet = email_data.get("snippet", "")
        body = email_data.get("body", snippet)
        
        # Check if it's spam first
        if detect_spam(subject, body, sender):
            return CATEGORY_SPAM, IMPORTANCE_LOW
        
        # Combine subject and body for text analysis
        text = f"{subject} {body}"
        
        # Check for meetings
        meetings = extract_meetings(text)
        if meetings:
            return CATEGORY_MEETING, IMPORTANCE_HIGH
        
        # Check for deadlines
        deadlines = extract_deadlines(text)
        if deadlines:
            return CATEGORY_DEADLINE, IMPORTANCE_HIGH
        
        # Check for important keywords
        for pattern in IMPORTANT_KEYWORDS:
            if re.search(pattern, text, re.IGNORECASE):
                return CATEGORY_IMPORTANT, IMPORTANCE_HIGH
        
        # Check for dates (potential events)
        dates = extract_dates(text)
        if dates:
            return CATEGORY_REGULAR, IMPORTANCE_MEDIUM
        
        # Default classification
        return CATEGORY_REGULAR, IMPORTANCE_LOW

    def sort_emails_by_importance(self, emails: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Sort a list of emails into categories based on importance and content
        
        Returns:
            Dictionary with categories as keys and lists of emails as values
        """
        categorized = {
            CATEGORY_IMPORTANT: [],
            CATEGORY_MEETING: [],
            CATEGORY_DEADLINE: [],
            CATEGORY_REGULAR: [],
            CATEGORY_SPAM: []
        }
        
        for email in emails:
            category, _ = self.classify_email(email)
            categorized[category].append(email)
        
        return categorized

    def get_emails_by_importance(self, emails: List[Dict]) -> Dict[int, List[Dict]]:
        """
        Group emails by importance level
        
        Returns:
            Dictionary with importance levels as keys and lists of emails as values
        """
        by_importance = {
            IMPORTANCE_HIGH: [],
            IMPORTANCE_MEDIUM: [],
            IMPORTANCE_LOW: []
        }
        
        for email in emails:
            _, importance = self.classify_email(email)
            by_importance[importance].append(email)
        
        return by_importance

    def enrich_email_with_classification(self, email: Dict) -> Dict:
        """
        Add classification metadata to an email object
        """
        category, importance = self.classify_email(email)
        
        # Create a copy to avoid modifying the original
        enriched = email.copy()
        
        # Add classification data
        enriched["category"] = category
        enriched["importance"] = importance
        
        # Add emoji indicators based on category
        if category == CATEGORY_IMPORTANT:
            enriched["icon"] = "⚠️"
        elif category == CATEGORY_MEETING:
            enriched["icon"] = "📅"
        elif category == CATEGORY_DEADLINE:
            enriched["icon"] = "⏰"
        elif category == CATEGORY_SPAM:
            enriched["icon"] = "🚫"
        else:
            enriched["icon"] = "📧"
        
        return enriched