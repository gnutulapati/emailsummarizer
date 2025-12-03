import base64
import email
from email.header import decode_header
import logging
from typing import List, Dict, Optional, Any
from googleapiclient.errors import HttpError
from datetime import datetime
import dateutil.parser as parser # For parsing date strings

# Import the service getter from auth.py
from auth import get_gmail_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cache for the service to avoid re-authentication within the same run
_gmail_service = None

def _get_service():
    """Gets the authenticated Gmail service, caching it locally."""
    global _gmail_service
    if _gmail_service is None:
        logger.info("Initializing Gmail service...")
        _gmail_service = get_gmail_service()
        logger.info("Gmail service initialized.")
    return _gmail_service

def _decode_header_simple(header: Optional[str]) -> str:
    """Simplified header decoding."""
    if header is None:
        return ""
    try:
        decoded_parts = decode_header(header)
        header_str = ''
        for part, encoding in decoded_parts:
            if isinstance(part, bytes):
                # If encoding is None, RFC 2047 specifies default us-ascii
                header_str += part.decode(encoding or 'us-ascii', errors='replace')
            elif isinstance(part, str):
                header_str += part
        return header_str
    except Exception as e:
        logger.warning(f"Could not decode header '{header}': {e}")
        # Fallback to returning the raw header or a placeholder
        return str(header) if isinstance(header, str) else "Decoding Error"


def _parse_email_part(part: Dict[str, Any]) -> str:
    """Recursively parses email parts to find plain text body."""
    mimeType = part.get('mimeType', '')
    body = part.get('body', {})
    data = body.get('data')
    text = ''

    if 'text/plain' in mimeType and data:
        # Decode base64url
        text = base64.urlsafe_b64decode(data).decode('utf-8', errors='replace')
    elif 'multipart/' in mimeType:
        parts = part.get('parts', [])
        for sub_part in parts:
            text = _parse_email_part(sub_part)
            # Return the first plain text part found
            if text:
                break
    # Add handling for text/html if plain text is not found (optional)
    # elif 'text/html' in mimeType and data:
    #     html_content = base64.urlsafe_b64decode(data).decode('utf-8', errors='replace')
    #     # Basic HTML stripping (consider using a library like beautifulsoup4 for robustness)
    #     import re
    #     text = re.sub('<[^<]+?>', '', html_content)

    return text

def fetch_recent_emails(max_results: int = 10, only_unread: bool = True) -> List[Dict]:
    """Fetches recent emails using the Gmail API.

    Args:
        max_results: Maximum number of emails to fetch.
        only_unread: If True, fetches only unread emails. Otherwise fetches recent emails.

    Returns:
        A list of dictionaries, each containing basic email details.
    """
    service = _get_service()
    emails_data = []
    try:
        # List messages
        query = 'is:unread' if only_unread else ''
        results = service.users().messages().list(
            userId='me',
            labelIds=['INBOX'],
            maxResults=max_results,
            q=query
        ).execute()

        messages = results.get('messages', [])
        if not messages:
            logger.info("No new messages found.")
            return []

        logger.info(f"Found {len(messages)} messages, fetching details...")

        for msg_ref in messages:
            msg_id = msg_ref['id']
            try:
                # Fetch message metadata (headers, snippet)
                # We fetch 'minimal' first, then potentially 'full' if needed later
                # For summary, snippet might be enough often.
                msg = service.users().messages().get(
                    userId='me',
                    id=msg_id,
                    format='metadata', # Fetch only headers and snippet initially
                    metadataHeaders=['Subject', 'From', 'Date']
                ).execute()

                payload = msg.get('payload', {})
                headers = payload.get('headers', [])
                snippet = msg.get('snippet', '')

                email_info = {
                    'id': msg['id'],
                    'threadId': msg['threadId'],
                    'subject': '',
                    'sender': '',
                    'date': '',
                    'snippet': snippet,
                    'body': None, # Body fetched separately if needed
                    'is_full': False
                }

                # Extract headers
                for header in headers:
                    name = header.get('name', '').lower()
                    value = header.get('value', '')
                    if name == 'subject':
                        email_info['subject'] = _decode_header_simple(value)
                    elif name == 'from':
                        email_info['sender'] = _decode_header_simple(value)
                    elif name == 'date':
                        # Parse date string into a standard format (ISO 8601)
                        try:
                            # Use dateutil.parser which handles various formats
                            dt_obj = parser.parse(value)
                            # Convert to timezone-aware ISO format string
                            email_info['date'] = dt_obj.isoformat()
                        except Exception as date_err:
                            logger.warning(f"Could not parse date header '{value}': {date_err}")
                            email_info['date'] = value # Fallback to original string

                # Placeholder: Add body later if needed for summarization or full view
                # For initial list, snippet is often sufficient
                email_info['content'] = snippet # Use snippet as initial content

                emails_data.append(email_info)

            except HttpError as error:
                logger.error(f'An error occurred fetching message {msg_id}: {error}')
            except Exception as e:
                 logger.error(f'An unexpected error occurred processing message {msg_id}: {e}')


        logger.info(f"Successfully fetched details for {len(emails_data)} emails.")
        return emails_data

    except HttpError as error:
        logger.error(f'An API error occurred: {error}')
        # Handle specific errors like expired credentials if necessary
        if error.resp.status == 401:
             logger.error("Authentication error. Token might be expired or revoked.")
             # Consider deleting token.json here or notifying user
        return []
    except Exception as e:
        logger.error(f'An unexpected error occurred during email fetching: {e}')
        return []


def get_full_email_content(message_id: str) -> Optional[Dict]:
    """Gets the full details (including body) of a specific email."""
    service = _get_service()
    try:
        msg = service.users().messages().get(
            userId='me',
            id=message_id,
            format='full' # Request full payload
        ).execute()

        payload = msg.get('payload', {})
        headers = payload.get('headers', [])
        snippet = msg.get('snippet', '') # Snippet is still useful

        email_details = {
            'id': msg['id'],
            'threadId': msg['threadId'],
            'subject': '',
            'sender': '',
            'date': '',
            'snippet': snippet,
            'body': '', # Initialize body
                'is_full': True
            }

        # Extract headers
        for header in headers:
            name = header.get('name', '').lower()
            value = header.get('value', '')
            if name == 'subject':
                email_details['subject'] = _decode_header_simple(value)
            elif name == 'from':
                email_details['sender'] = _decode_header_simple(value)
            elif name == 'date':
                 try:
                    dt_obj = parser.parse(value)
                    email_details['date'] = dt_obj.isoformat()
                 except Exception as date_err:
                    logger.warning(f"Could not parse date header '{value}': {date_err}")
                    email_details['date'] = value

        # Parse body
        email_details['body'] = _parse_email_part(payload)
        email_details['content'] = email_details['body'] # Use full body as content

        return email_details

    except HttpError as error:
        logger.error(f'An API error occurred fetching full email {message_id}: {error}')
        return None
    except Exception as e:
        logger.error(f'An unexpected error occurred fetching full email {message_id}: {e}')
        return None

# Example Usage (optional, for testing)
# if __name__ == '__main__':
#     # Ensure you run this after authenticating once
#     print("Fetching recent emails...")
#     recent_emails = fetch_recent_emails(max_results=5)
#     if recent_emails:
#         print(f"Fetched {len(recent_emails)} emails.")
#         for email_info in recent_emails:
#             print(f"  ID: {email_info['id']}, Subject: {email_info['subject']}, From: {email_info['sender']}")

#         # Example: Fetch full content of the first email
#         first_email_id = recent_emails[0]['id']
#         print(f"\nFetching full content for email ID: {first_email_id}")
#         full_email = get_full_email_content(first_email_id)
#         if full_email:
#             print(f"  Subject: {full_email['subject']}")
#             print(f"  From: {full_email['sender']}")
#             print(f"  Date: {full_email['date']}")
#             print(f"  Body Preview: {full_email['body'][:200]}...") # Print first 200 chars
#     else:
#         print("Could not fetch emails.")
