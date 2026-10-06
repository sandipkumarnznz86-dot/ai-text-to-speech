import logging
import os
import tempfile
import threading
from io import BytesIO

import pyttsx3
from flask import Flask, jsonify, render_template, request, send_file, url_for


app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024
app.logger.setLevel(logging.INFO)

MAX_CHARACTERS = 500
MIN_RATE = 100
MAX_RATE = 250
speech_lock = threading.Lock()


def get_voices():
    with speech_lock:
        engine = pyttsx3.init()
        try:
            return [
                {"id": voice.id, "name": voice.name}
                for voice in engine.getProperty("voices")
            ]
        finally:
            engine.stop()


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/health")
def health():
    return jsonify({"success": True})


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify({"success": False, "message": "The request is too large."}), 413


@app.get("/voices")
def voices():
    try:
        return jsonify({"success": True, "voices": get_voices()})
    except Exception:
        app.logger.exception("Unable to load available voices")
        return jsonify({"success": False, "message": "Voice settings are unavailable."}), 500


@app.post("/speak")
def speak():
    if not request.is_json:
        return jsonify({"success": False, "message": "Send a valid JSON request."}), 400

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "message": "Send a valid JSON request."}), 400

    text = data.get("text")
    if not isinstance(text, str) or not text.strip():
        return jsonify({"success": False, "message": "Enter some text before speaking."}), 400
    if len(text) > MAX_CHARACTERS:
        return jsonify({"success": False, "message": "Text must be 500 characters or fewer."}), 400

    voice_id = data.get("voice")
    if voice_id is not None and not isinstance(voice_id, str):
        return jsonify({"success": False, "message": "Choose an available voice."}), 400

    rate = data.get("rate", 175)
    if isinstance(rate, bool) or not isinstance(rate, int) or not MIN_RATE <= rate <= MAX_RATE:
        return jsonify({"success": False, "message": "Choose a valid speech speed."}), 400

    try:
        with speech_lock, tempfile.TemporaryDirectory() as temp_dir:
            audio_path = os.path.join(temp_dir, "voxly-speech.wav")
            engine = pyttsx3.init()
            try:
                if voice_id:
                    available_voice_ids = {
                        voice.id for voice in engine.getProperty("voices")
                    }
                    if voice_id not in available_voice_ids:
                        return jsonify({"success": False, "message": "Choose an available voice."}), 400
                    engine.setProperty("voice", voice_id)
                engine.setProperty("rate", rate)
                engine.setProperty("volume", 1.0)
                engine.save_to_file(text, audio_path)
                engine.runAndWait()
            finally:
                engine.stop()

            with open(audio_path, "rb") as audio_file:
                audio = BytesIO(audio_file.read())

        audio.seek(0)
        return send_file(audio, mimetype="audio/wav", download_name="voxly-speech.wav")
    except Exception:
        app.logger.exception("Speech generation failed")
        return jsonify({"success": False, "message": "Speech could not be generated. Please try again."}), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "5000")),
        debug=False,
    )
