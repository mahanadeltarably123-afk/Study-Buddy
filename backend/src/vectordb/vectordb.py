import chromadb
import os
import uuid
from typing import List

class VectorStore:
    def __init__(self, collection_name="study_buddy"):
        self.persist_directory = os.path.join(os.getcwd(), "data", "embeddings")
        os.makedirs(self.persist_directory, exist_ok=True)
        
        self.client = chromadb.PersistentClient(path=self.persist_directory)
        self.collection = self.client.get_or_create_collection(name=collection_name)

    def add_documents(self, texts: List[str], metadatas: List[dict] = None):
        """
        Add texts to the vector store.
        """
        if not texts:
            return

        ids = [str(uuid.uuid4()) for _ in texts]
        
        # If no metadata provided, create empty dicts
        if metadatas is None:
            metadatas = [{} for _ in texts]
            
        self.collection.add(
            documents=texts,
            metadatas=metadatas,
            ids=ids
        )

    def as_retriever(self):
        """
        Return the collection (or a wrapper) to be used for retrieval.
        For simplicity in this raw implementation, we might just return self
        and have a query method.
        """
        return self

    def query(self, query_text: str, n_results: int = 5):
        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results
        )
        return results
