import chromadb
from chromadb.config import Settings
import os
from typing import List, Dict

class RAGStore:
    def __init__(self):
        host = os.getenv("CHROMA_DB_HOST", "chromadb")
        port = os.getenv("CHROMA_DB_PORT", "8000")
        
        # Connect to ChromaDB server
        self.client = chromadb.HttpClient(host=host, port=int(port))
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(name="brand_context")

    def add_documents(self, documents: List[str], metadatas: List[Dict], ids: List[str]):
        """Add documents to the vector store."""
        self.collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )

    def add_case(self, doc_id: str, text: str, metadata: Dict):
        """Add a single case to the vector store."""
        self.collection.add(
            documents=[text],
            metadatas=[metadata],
            ids=[doc_id]
        )

    def query(self, query_text: str, user_id: int | None = None, n_results: int = 3, threshold: float = 1.5) -> List[str]:
        """Retrieve relevant documents with distance threshold, optionally filtered by user_id."""
        
        # Build query params
        query_params = {
            "query_texts": [query_text],
            "n_results": n_results
        }
        
        # Only filter by user_id if provided (for API calls)
        # Workflow/Agents may call without user_id to search across all users
        if user_id is not None:
            query_params["where"] = {"user_id": user_id}
        
        results = self.collection.query(**query_params)
        
        # results['distances'] contains the distance metric (lower is better)
        # results['documents'] contains the text
        
        if not results['documents']:
            return []
            
        final_docs = []
        # Check distances if available
        distances = results['distances'][0] if 'distances' in results and results['distances'] else []
        documents = results['documents'][0]
        
        user_info = f"User {user_id}" if user_id else "All Users"
        print(f"DEBUG: Querying RAG ({user_info}). Found {len(documents)} candidates.")
        
        for i, doc in enumerate(documents):
            if distances:
                dist = distances[i]
                if dist > threshold:
                    continue
            final_docs.append(doc)
            
        return final_docs

# Global instance
rag_store = RAGStore()
