def get_embedding_function():
    """
    Return embedding function using SentenceTransformerEmbeddings.
    """
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('all-MiniLM-L6-v2')
    def embed(texts):
        return model.encode(texts, show_progress_bar=False).tolist()
    return embed
