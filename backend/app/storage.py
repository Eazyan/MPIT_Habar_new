from minio import Minio
import os
import io
import json
from datetime import timedelta

class StorageClient:
    def __init__(self):
        self.client = Minio(
            endpoint=os.getenv("MINIO_ENDPOINT", "minio:9000"),
            access_key=os.getenv("MINIO_ROOT_USER", "minioadmin"),
            secret_key=os.getenv("MINIO_ROOT_PASSWORD", "minioadmin"),
            secure=False
        )
        self.history_bucket = "history"
        self.rag_bucket = "rag-knowledge"
        
        # Ensure buckets exist
        self._ensure_bucket(self.history_bucket)
        self._ensure_bucket(self.rag_bucket)

    def _ensure_bucket(self, bucket_name):
        try:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
                print(f"Created bucket: {bucket_name}")
        except Exception as e:
            print(f"MinIO Init Error ({bucket_name}): {e}")

    def save_generation(self, user_id: int, plan_id: str, data: dict):
        """Saves the full generation data to the history bucket."""
        try:
            # Save JSON
            json_data = json.dumps(data, ensure_ascii=False, default=str).encode('utf-8')
            self.client.put_object(
                self.history_bucket,
                f"users/{user_id}/plans/{plan_id}/data.json",
                io.BytesIO(json_data),
                len(json_data),
                content_type="application/json"
            )
            return True
        except Exception as e:
            print(f"MinIO Save Error: {e}")
            return False

    def promote_to_rag(self, user_id: int, plan_id: str, category: str = "ROUTINE"):
        """Copies data from history bucket to rag-knowledge bucket with categorization."""
        from minio.commonconfig import CopySource
        try:
            # Copy JSON to categorized folder (kept global for now, or per user?)
            # Valid question: Is knowledge base shared? 
            # For now, let's keep knowledge base somewhat global but maybe tag it?
            # Actually, per user isolation requested: 
            self.client.copy_object(
                self.rag_bucket,
                f"users/{user_id}/{category}/{plan_id}/data.json",
                CopySource(self.history_bucket, f"users/{user_id}/plans/{plan_id}/data.json")
            )
            return True
        except Exception as e:
            print(f"MinIO Promote Error: {e}")
            return False

    def get_generation(self, user_id: int, plan_id: str) -> dict:
        """Reads generation data from history bucket."""
        try:
            response = self.client.get_object(self.history_bucket, f"users/{user_id}/plans/{plan_id}/data.json")
            return json.loads(response.read())
        except Exception as e:
            print(f"MinIO Read Error: {e}")
            return None

    def update_generation(self, user_id: int, plan_id: str, updates: dict) -> bool:
        """Updates specific fields of a generation."""
        try:
            current_data = self.get_generation(user_id, plan_id)
            if not current_data:
                return False
            
            # Update fields
            current_data.update(updates)
            
            # Save back
            return self.save_generation(user_id, plan_id, current_data)
        except Exception as e:
            print(f"MinIO Update Error: {e}")
            return False

    def list_generations(self, user_id: int, limit: int = 10) -> list:
        """Lists recent generations from history bucket."""
        try:
            # List objects with prefix
            prefix = f"users/{user_id}/plans/"
            objects = list(self.client.list_objects(self.history_bucket, prefix=prefix, recursive=True))
            
            # Filter for data.json files
            data_files = [obj for obj in objects if obj.object_name.endswith("data.json")]
            
            # Sort by Last Modified Descending
            data_files.sort(key=lambda x: x.last_modified, reverse=True)
            
            # Take top N
            recent_files = data_files[:limit]
            
            results = []
            for obj in recent_files:
                response = self.client.get_object(self.history_bucket, obj.object_name)
                data = json.loads(response.read())
                results.append(data)
                
            return results
        except Exception as e:
            print(f"MinIO List Error: {e}")
            return []

# Global instance
storage = StorageClient()
