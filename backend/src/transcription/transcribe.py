import os

try:
    import whisper
    WHISPER_AVAILABLE = True
except Exception as e:
    print(f"Warning: Whisper not available: {e}")
    WHISPER_AVAILABLE = False

def transcribe_audio(file_path: str) -> str:
    """
    Transcribe audio file using OpenAI Whisper (local).
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    if not WHISPER_AVAILABLE:
        return "Transcription unavailable: Whisper library could not be loaded on the server."

    # Load model (base is a good balance of speed/accuracy)
    try:
        model = whisper.load_model("base")
        result = model.transcribe(file_path)
        return result["text"].strip()
    except Exception as e:
        return f"Transcription error: {str(e)}"
