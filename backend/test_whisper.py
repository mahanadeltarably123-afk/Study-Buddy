try:
    import whisper
    print("Whisper imported successfully")
except Exception as e:
    print(f"Error importing whisper: {e}")
    import traceback
    traceback.print_exc()
