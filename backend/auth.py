import os
import pickle
import json # Use json instead of pickle
import pathlib
from dotenv import load_dotenv

# Load .env variables from the backend directory
script_dir = pathlib.Path(__file__).resolve().parent
dotenv_path = script_dir / '.env'
if dotenv_path.exists():
    load_dotenv(dotenv_path=dotenv_path)
else:
    print(f"Warning: {dotenv_path} not found in auth.py")

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials # Use Credentials directly
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

# Get paths from environment variables, relative to backend directory
# The paths in .env are relative to backend dir (e.g., ../credentials.json)
# We need to resolve them relative to the script_dir
backend_dir = script_dir
creds_path_str = os.getenv("GOOGLE_CREDENTIALS_PATH", "../credentials.json")
token_path_str = os.getenv("GOOGLE_TOKEN_PATH", "../token.json")

# Resolve paths relative to the backend directory
CREDS_PATH = (backend_dir / creds_path_str).resolve()
TOKEN_PATH = (backend_dir / token_path_str).resolve()

print(f"DEBUG Auth: Using Credentials Path: {CREDS_PATH}")
print(f"DEBUG Auth: Using Token Path: {TOKEN_PATH}")

def get_gmail_service():
    creds = None

    # Load token from token.json if it exists
    if TOKEN_PATH.exists():
        try:
            # Use Credentials.from_authorized_user_file for JSON tokens
            creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
            print(f"DEBUG Auth: Loaded credentials from {TOKEN_PATH}")
        except Exception as e:
             print(f"Error loading token from {TOKEN_PATH}: {e}. Will attempt re-authentication.")
             creds = None # Ensure creds is None if loading fails

    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print(f"DEBUG Auth: Refreshing expired token from {TOKEN_PATH}...")
            try:
                creds.refresh(Request())
                print("DEBUG Auth: Token refreshed successfully.")
            except Exception as e:
                print(f"Error refreshing token: {e}. Deleting invalid token and re-authenticating.")
                try:
                    TOKEN_PATH.unlink() # Remove invalid token file
                except OSError as del_err:
                    print(f"Error deleting token file {TOKEN_PATH}: {del_err}")
                creds = None # Force re-authentication
        else:
            print(f"DEBUG Auth: No valid token found or refresh failed. Starting new authentication flow...")
            if not CREDS_PATH.exists():
                print(f"ERROR: Credentials file not found at {CREDS_PATH}. Cannot authenticate.")
                raise FileNotFoundError(f"Credentials file not found at {CREDS_PATH}")
            try:
                flow = InstalledAppFlow.from_client_secrets_file(
                    str(CREDS_PATH), SCOPES)
                # The run_local_server method will open the browser
                print("DEBUG Auth: Starting local server for authentication...")
                creds = flow.run_local_server(port=0)
                print("DEBUG Auth: Authentication flow completed.")
            except Exception as e:
                print(f"Error during authentication flow: {e}")
                raise # Re-raise the exception to stop execution if auth fails

        # Save the credentials for the next run
        try:
            # Use to_json() method and save as JSON
            with open(TOKEN_PATH, 'w') as token_file:
                token_file.write(creds.to_json())
            print(f"DEBUG Auth: Credentials saved to {TOKEN_PATH}")
        except Exception as e:
            print(f"Error saving token to {TOKEN_PATH}: {e}")

    try:
        print("DEBUG Auth: Building Gmail service...")
        service = build('gmail', 'v1', credentials=creds)
        print("DEBUG Auth: Gmail service built successfully.")
        return service
    except Exception as e:
        print(f"Error building Gmail service: {e}")
        raise # Re-raise the exception