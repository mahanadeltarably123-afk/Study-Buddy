import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
import os
import whisper
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src', 'chunking')))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src', 'embedding')))
from chunk import chunk_text
from embed import get_embedding_function

def hf_transcribe(file_path: str) -> str:
    model = whisper.load_model('base')
    result = model.transcribe(file_path)
    return result['text'].strip() if result and 'text' in result else ''


def run_pipeline(audio_path: str):
    print(f"Transcribing: {audio_path}")
    transcript = hf_transcribe(audio_path)
    print("Transcript:", transcript)
    chunks = chunk_text(transcript)
    print(f"Chunks: {len(chunks)}")
    embed_fn = get_embedding_function()
    embeddings = embed_fn(chunks)
    print(f"Embeddings shape: {len(embeddings)} x {len(embeddings[0]) if embeddings else 0}")
    return {
        'transcript': transcript,
        'chunks': chunks,
        'embeddings': embeddings
    }

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python pipeline.py <audio_file>")
        exit(1)
    audio_file = sys.argv[1]
    result = run_pipeline(audio_file)
    print("Pipeline result:", result)
