import re
import datetime
from typing import Dict, List, Optional, Tuple
from dateutil import parser as date_parser

# --- Constants (previously in notifier) --- #
# Note: These are duplicated from email_classifier.py for now
# Consider a shared constants module later if needed.
MEETING_PATTERNS = [
    r'invitation:.*@.*\b', # Looks for patterns like "invitation: meeting title @ location"
    r'\b(meeting|call|conference|zoom|google meet|teams meeting|appointment|schedule)\b'
    # Added schedule, appointment
]

DEADLINE_PATTERNS = [
    r'\b(deadline|due by|submit by|due on|final submission|project due)\b'
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

class Event:
    """Class to represent an extracted event from an email"""
    def __init__(self, event_type: str, description: str, date_str: Optional[str] = None, 
                 email_id: Optional[str] = None, confidence: float = 0.5):
        self.event_type = event_type  # meeting, deadline, or other
        self.description = description
        self.date_str = date_str
        self.email_id = email_id
        self.confidence = confidence  # confidence score between 0 and 1
        self._parsed_date = None
        
        # Try to parse the date if provided
        if date_str:
            try:
                self._parsed_date = date_parser.parse(date_str, fuzzy=True)
            except (ValueError, TypeError):
                pass
    
    @property
    def date(self) -> Optional[datetime.datetime]:
        return self._parsed_date
    
    @property
    def is_today(self) -> bool:
        if not self._parsed_date:
            return False
        today = datetime.datetime.now().date()
        return self._parsed_date.date() == today
    
    @property
    def is_tomorrow(self) -> bool:
        if not self._parsed_date:
            return False
        tomorrow = (datetime.datetime.now() + datetime.timedelta(days=1)).date()
        return self._parsed_date.date() == tomorrow
    
    @property
    def days_until(self) -> Optional[int]:
        if not self._parsed_date:
            return None
        today = datetime.datetime.now().date()
        delta = self._parsed_date.date() - today
        return delta.days
    
    def to_dict(self) -> Dict:
        """Convert event to dictionary for serialization"""
        return {
            "event_type": self.event_type,
            "description": self.description,
            "date_str": self.date_str,
            "email_id": self.email_id,
            "confidence": self.confidence,
            "is_today": self.is_today,
            "is_tomorrow": self.is_tomorrow,
            "days_until": self.days_until,
            "formatted_date": self._parsed_date.strftime("%Y-%m-%d %H:%M") if self._parsed_date else None
        }

# --- Helper Functions --- #
def extract_date_context(text: str, match_start: int, match_end: int, window_size: int = 100) -> str:
    """Extract context around a date mention"""
    start = max(0, match_start - window_size // 2)
    end = min(len(text), match_end + window_size // 2)
    return text[start:end]

def find_dates_in_text(text: str) -> List[Tuple[str, str]]:
    """Find dates in text and return (date_string, context) tuples"""
    results = []

    for pattern in DATE_PATTERNS:
        # Use finditer to get match objects, allowing access to start/end and matched string
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            date_str = match.group(0) # Get the actual matched string
            # Basic validation using dateutil.parser
            try:
                date_parser.parse(date_str, fuzzy=True)
                context = extract_date_context(text, match.start(), match.end())
                results.append((date_str, context))
            except (ValueError, TypeError):
                pass # Ignore strings that don't parse as dates

    return results

# --- Event Extractor Class --- #
class EventExtractor:
    def extract_events(self, email_data: Dict) -> List[Event]:
        """Extract events from an email using defined patterns"""
        subject = email_data.get("subject", "")
        sender = email_data.get("from", "") # Added sender, though not used yet
        snippet = email_data.get("snippet", "")
        body = email_data.get("body", snippet)
        email_id = email_data.get("id")

        # Combine subject and body for analysis
        text = f"{subject}\n{body}"
        events = []

        # Use a set to keep track of context strings already processed for a type
        processed_contexts = set()

        # Extract meetings
        for pattern in MEETING_PATTERNS:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                context = extract_date_context(text, match.start(), match.end())
                context_key = ("meeting", context)
                if context_key in processed_contexts:
                    continue # Avoid processing the same context multiple times for meetings

                date_found_in_context = False
                date_matches = find_dates_in_text(context) # Search only within context
                if date_matches:
                    for date_str, _ in date_matches:
                        events.append(Event(
                            event_type="meeting",
                            description=context,
                            date_str=date_str,
                            email_id=email_id,
                            confidence=0.8
                        ))
                        date_found_in_context = True

                # If no date was found *within the immediate context* of the keyword,
                # still record the meeting mention but with lower confidence/no date.
                if not date_found_in_context:
                    events.append(Event(
                        event_type="meeting",
                        description=context, # Use the keyword context
                        email_id=email_id,
                        confidence=0.6
                    ))
                processed_contexts.add(context_key)

        # Extract deadlines
        for pattern in DEADLINE_PATTERNS:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                context = extract_date_context(text, match.start(), match.end())
                context_key = ("deadline", context)
                if context_key in processed_contexts:
                    continue

                date_found_in_context = False
                date_matches = find_dates_in_text(context) # Search only within context
                if date_matches:
                    for date_str, _ in date_matches:
                        events.append(Event(
                            event_type="deadline",
                            description=context,
                            date_str=date_str,
                            email_id=email_id,
                            confidence=0.9
                        ))
                        date_found_in_context = True

                if not date_found_in_context:
                     events.append(Event(
                        event_type="deadline",
                        description=context,
                        email_id=email_id,
                        confidence=0.7
                    ))
                processed_contexts.add(context_key)

        # Extract generic events/dates (only if not already captured as part of meeting/deadline context)
        all_date_matches = find_dates_in_text(text) # Search the whole text
        for date_str, context in all_date_matches:
            # Check if this date string/context overlaps significantly with already found events
            is_already_captured = False
            for event in events:
                # Simple check: is the date string within an existing event's description (context)?
                if event.date_str and date_str in event.description:
                    is_already_captured = True
                    break
                # More robust check needed? Compare start/end positions if available.

            if not is_already_captured:
                 # Avoid adding generic date if it was the trigger for a meeting/deadline
                 if not any(ctx_key[1] == context for ctx_key in processed_contexts):
                     events.append(Event(
                         event_type="event", # Generic event type
                         description=context, # Context around the date
                         date_str=date_str,
                         email_id=email_id,
                         confidence=0.5
                     ))
                     # Add to processed contexts to avoid re-adding if found by another pattern?
                     # processed_contexts.add(("event", context))

        return events

# --- Event Filtering Functions --- #
def get_upcoming_events(events: List[Event], days_ahead: int = 7) -> List[Event]:
    """Filter events to only those occurring within the specified days ahead"""
    upcoming = []
    
    for event in events:
        if event.days_until is not None and 0 <= event.days_until <= days_ahead:
            upcoming.append(event)
    
    # Sort by date
    upcoming.sort(key=lambda e: e.days_until if e.days_until is not None else float('inf'))
    
    return upcoming

def get_todays_events(events: List[Event]) -> List[Event]:
    """Get events occurring today"""
    return [event for event in events if event.is_today]

def get_tomorrows_events(events: List[Event]) -> List[Event]:
    """Get events occurring tomorrow"""
    return [event for event in events if event.is_tomorrow]