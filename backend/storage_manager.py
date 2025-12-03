"""
Storage Manager module for Email Summarizer
Provides a unified interface for storing and retrieving email summaries,
with implementations for both local JSON storage and Firebase Firestore.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
import abc

logger = logging.getLogger(__name__)

class StorageManager(abc.ABC):
    """Abstract base class for storage implementations."""
    
    @abc.abstractmethod
    def store_summary(self, email_id: str, summary_data: Dict[str, Any]) -> bool:
        """Store a summary for an email ID."""
        pass
    
    @abc.abstractmethod
    def get_summary(self, email_id: str) -> Optional[Dict[str, Any]]:
        """Get a summary for a specific email ID."""
        pass
    
    @abc.abstractmethod
    def get_recent_summaries(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get the most recent summaries, up to the specified limit."""
        pass
    
    @abc.abstractmethod
    def summary_exists(self, email_id: str) -> bool:
        """Check if a summary exists for the given email ID."""
        pass


class JSONStorageManager(StorageManager):
    """Implementation that stores summaries in a local JSON file."""
    
    def __init__(self, file_path: str):
        """Initialize with the path to the JSON storage file."""
        self.file_path = Path(file_path).resolve()
        self._ensure_file_exists()
    
    def _ensure_file_exists(self):
        """Create the storage file if it doesn't exist."""
        if not self.file_path.exists():
            # Create parent directories if they don't exist
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            # Create empty JSON structure
            with open(self.file_path, 'w') as f:
                json.dump({}, f)
            logger.info(f"Created new JSON storage file at {self.file_path}")
    
    def _read_data(self) -> Dict[str, Any]:
        """Read all data from the JSON file."""
        try:
            with open(self.file_path, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            logger.error(f"Error decoding JSON from {self.file_path}. File may be corrupted.")
            return {}
        except Exception as e:
            logger.error(f"Error reading from {self.file_path}: {e}")
            return {}
    
    def _write_data(self, data: Dict[str, Any]) -> bool:
        """Write all data to the JSON file."""
        try:
            with open(self.file_path, 'w') as f:
                json.dump(data, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Error writing to {self.file_path}: {e}")
            return False
    
    def store_summary(self, email_id: str, summary_data: Dict[str, Any]) -> bool:
        """Store a summary for an email ID in the JSON file."""
        data = self._read_data()
        
        # Add processing timestamp if not present
        if 'processed_at' not in summary_data:
            summary_data['processed_at'] = datetime.now().isoformat()
        
        # Store the summary with the email ID as the key
        data[email_id] = summary_data
        
        return self._write_data(data)
    
    def get_summary(self, email_id: str) -> Optional[Dict[str, Any]]:
        """Get a summary for a specific email ID from the JSON file."""
        data = self._read_data()
        summary = data.get(email_id)
        
        if summary:
            # Make sure ID is included
            summary['id'] = email_id
        
        return summary
    
    def get_recent_summaries(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get the most recent summaries from the JSON file, sorted by date."""
        data = self._read_data()
        
        # Convert to list of dictionaries with ID included
        summaries = []
        for email_id, summary in data.items():
            summary_with_id = summary.copy()
            summary_with_id['id'] = email_id
            summaries.append(summary_with_id)
        
        # Sort by date (newest first)
        summaries.sort(
            key=lambda x: x.get('date', x.get('processed_at', '')), 
            reverse=True
        )
        
        # Return only the requested number
        return summaries[:limit]
    
    def summary_exists(self, email_id: str) -> bool:
        """Check if a summary exists for the given email ID in the JSON file."""
        data = self._read_data()
        return email_id in data


class FirestoreStorageManager(StorageManager):
    """Implementation that stores summaries in Firebase Firestore."""
    
    def __init__(self, db, collection_name: str):
        """Initialize with Firestore database instance and collection name."""
        self.db = db
        self.collection_name = collection_name
        self.collection = db.collection(collection_name)
        logger.info(f"Initialized Firestore storage with collection '{collection_name}'")
    
    def store_summary(self, email_id: str, summary_data: Dict[str, Any]) -> bool:
        """Store a summary for an email ID in Firestore."""
        try:
            # Import needed here to avoid circular import
            from firebase_admin import firestore
            
            # Add server timestamp if needed
            if 'processed_at' not in summary_data:
                summary_data['processed_at'] = firestore.SERVER_TIMESTAMP
            
            # Store document with email_id as the document ID
            doc_ref = self.collection.document(email_id)
            doc_ref.set(summary_data)
            logger.info(f"Stored summary for email {email_id} in Firestore")
            return True
        except Exception as e:
            logger.error(f"Error storing summary in Firestore: {e}")
            return False
    
    def get_summary(self, email_id: str) -> Optional[Dict[str, Any]]:
        """Get a summary for a specific email ID from Firestore."""
        try:
            doc_ref = self.collection.document(email_id)
            doc = doc_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id  # Add the document ID as 'id'
                
                # Convert any Firebase timestamps to ISO format strings
                self._convert_timestamps(data)
                
                return data
            else:
                logger.info(f"No summary found for email {email_id}")
                return None
        except Exception as e:
            logger.error(f"Error retrieving summary from Firestore: {e}")
            return None
    
    def get_recent_summaries(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get the most recent summaries from Firestore, sorted by date."""
        try:
            # Import needed here to avoid circular import
            from firebase_admin import firestore
            
            summaries = []
            
            # Query Firestore for the most recent summaries
            query = (self.collection
                    .order_by("date", direction=firestore.Query.DESCENDING)
                    .limit(limit))
            
            docs = query.stream()
            
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id  # Add the document ID
                
                # Convert any Firebase timestamps to ISO format strings
                self._convert_timestamps(data)
                
                summaries.append(data)
            
            return summaries
        except Exception as e:
            logger.error(f"Error retrieving summaries from Firestore: {e}")
            return []
    
    def _convert_timestamps(self, data: Dict[str, Any]):
        """Convert any Firestore timestamps to ISO format strings."""
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    
    def summary_exists(self, email_id: str) -> bool:
        """Check if a summary exists for the given email ID in Firestore."""
        try:
            doc_ref = self.collection.document(email_id)
            return doc_ref.get().exists
        except Exception as e:
            logger.error(f"Error checking if summary exists in Firestore: {e}")
            return False


def get_storage_manager() -> StorageManager:
    """Factory function to create the appropriate storage manager based on configuration."""
    storage_option = os.getenv("STORAGE_OPTION", "local").lower()
    
    if storage_option == "local":
        # Use local JSON storage
        storage_path = os.getenv("LOCAL_STORAGE_PATH", "../email_summaries.json")
        logger.info(f"Using local JSON storage at: {storage_path}")
        return JSONStorageManager(storage_path)
    
    elif storage_option == "firestore":
        # Use Firebase Firestore
        try:
            # Import Firebase modules only if needed
            import firebase_admin
            from firebase_admin import firestore
            
            # Get the existing Firebase app or create one if needed
            try:
                app = firebase_admin.get_app()
            except ValueError:
                logger.error("Firebase app not initialized. Please initialize it before creating storage manager.")
                raise
            
            db = firestore.client()
            collection_name = os.getenv("FIRESTORE_COLLECTION", "email_summaries")
            logger.info(f"Using Firestore storage with collection: {collection_name}")
            
            return FirestoreStorageManager(db, collection_name)
        except Exception as e:
            logger.error(f"Error creating Firestore storage manager: {e}")
            logger.warning("⚠️ Falling back to local JSON storage due to Firestore initialization error.")
            
            # Fallback to JSON storage
            storage_path = os.getenv("LOCAL_STORAGE_PATH", "../email_summaries.json")
            return JSONStorageManager(storage_path)
    
    else:
        # Invalid option, use local as default
        logger.warning(f"Unknown storage option '{storage_option}'. Using local JSON storage as fallback.")
        storage_path = os.getenv("LOCAL_STORAGE_PATH", "../email_summaries.json")
        return JSONStorageManager(storage_path) 