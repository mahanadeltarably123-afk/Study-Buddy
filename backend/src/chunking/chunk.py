def chunk_text(text):
    """
    Split text into chunks using LangChain's RecursiveCharacterTextSplitter.
    """
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100
    )
    return splitter.split_text(text)
