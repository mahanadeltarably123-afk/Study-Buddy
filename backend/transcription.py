import google.generativeai as genai
genai.configure(api_key="AIzaSyA4AGDj36uPoAWWsPXskAp71D0MGiPc_mg")
import os
import mimetypes
import google.generativeai as genai
genai.configure(api_key="AIzaSyA4AGDj36uPoAWWsPXskAp71D0MGiPc_mg")

import os
import sys
import mimetypes
import argparse
from typing import Optional

# Optional: load .env if python-dotenv is installed
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Gemini SDK
try:
    import google.generativeai as genai
except ImportError:
    genai = None

# Hugging Face InferenceClient
try:
    from huggingface_hub import InferenceClient
except ImportError:
    InferenceClient = None

# --- Utility Functions ---
def detect_mime_type(file_path: str) -> str:
    mime_type, _ = mimetypes.guess_type(file_path)
    return mime_type or 'application/octet-stream'

# --- Gemini Transcription ---
def transcribe_small_file(model_name: str, file_path: str, api_key: Optional[str] = None, allow_fallback: bool = True) -> str:
    try:
        if not genai:
            raise ImportError('google-generativeai SDK not installed')
        key = api_key or os.getenv('GOOGLE_API_KEY')
        genai.configure(api_key=key)
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(
            [file_path],
            generation_config={"response_mime_type": "text/plain"},
            stream=False
        )
        return response.text.strip()
    except Exception as e:
        if allow_fallback:
            return hf_fallback(file_path)
        raise RuntimeError(f"Gemini transcription failed: {e}")


def transcribe_large_file(model_name: str, file_path: str, api_key: Optional[str] = None, allow_fallback: bool = True) -> str:
    try:
        if not genai:
            raise ImportError('google-generativeai SDK not installed')
        key = api_key or os.getenv('GOOGLE_API_KEY')
        genai.configure(api_key=key)
        model = genai.GenerativeModel(model_name)
        uploaded = genai.upload_file(file_path)
        response = model.generate_content(
            [uploaded],
            generation_config={"response_mime_type": "text/plain"},
            stream=False
        )
        return response.text.strip()
    except Exception as e:
        if allow_fallback:
            return hf_fallback(file_path)
        raise RuntimeError(f"Gemini transcription failed: {e}")

# --- Hugging Face Whisper Fallback ---
def hf_fallback(file_path: str) -> str:
    if not InferenceClient:
        raise ImportError('huggingface_hub not installed')
    hf_key = os.getenv('HF_TOKEN')
    if not hf_key:
        raise RuntimeError('HF_TOKEN not set for fallback')
    client = InferenceClient(token=hf_key)
    with open(file_path, 'rb') as f:
        result = client.transcribe(f)
    return result.strip() if result else ''

# --- Main Transcription Function ---
def transcribe_audio(file_path: str, model_name: str = "gemini-1.5-flash", api_key: Optional[str] = None, allow_fallback: bool = True) -> str:
    file_size = os.path.getsize(file_path)
    if file_size < 20 * 1024 * 1024:
        return transcribe_small_file(model_name, file_path, api_key, allow_fallback)
    else:
        return transcribe_large_file(model_name, file_path, api_key, allow_fallback)

# --- CLI ---
def main():
    parser = argparse.ArgumentParser(description="Transcribe audio using Gemini, fallback to HF Whisper if needed.")
    parser.add_argument('file', help='Path to audio file')
    parser.add_argument('--model', default='gemini-1.5-flash', help='Gemini model name')
    parser.add_argument('--api-key', default=None, help='Override GOOGLE_API_KEY')
    parser.add_argument('--no-fallback', action='store_true', help='Disable Hugging Face fallback')
    args = parser.parse_args()
    try:
        text = transcribe_audio(
            args.file,
            model_name=args.model,
            api_key=args.api_key,
            allow_fallback=not args.no_fallback
        )
        print(text)
    except Exception as e:
        print(f"Transcription error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
