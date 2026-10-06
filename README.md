# Voxly AI

Voxly AI is a Python Flask text-to-speech app. It uses the speech engine installed on the server to generate audio and sends the audio to the browser for playback.

## Features

- Text-to-speech with server-installed voices
- Voice, speech speed, and playback volume controls
- Character counter and responsive interface
- No login or database required

## Run locally

Requirements: Python 3.10 or newer and a speech engine supported by `pyttsx3`.

```bash
python -m venv venv
```

On Windows:

```powershell
venv\Scripts\activate
```

On macOS or Linux:

```bash
source venv/bin/activate
```

Install the Python dependencies and run the app:

```bash
pip install -r requirements.txt
python app.py
```

Open <http://127.0.0.1:5000>. To use another port, set the `PORT` environment variable before starting the app.

## Deploy publicly on Render

GitHub Pages only hosts static files and cannot run Flask or Python. Deploy Voxly as a Render web service instead; the included `render.yaml` and `Dockerfile` configure the service and install eSpeak NG, which `pyttsx3` needs on Linux.

1. Push this repository to GitHub.
2. Sign in to [Render](https://render.com/) and choose **New > Blueprint**.
3. Connect `sandipkumarnznz86-dot/ai-text-to-speech` and apply the blueprint.
4. Wait for the Docker build and deployment to finish. Render will assign the service a public `onrender.com` URL; open that URL to use Voxly AI.

You can also start from [Render's Blueprint deployment page](https://render.com/deploy?repo=https://github.com/sandipkumarnznz86-dot/ai-text-to-speech).

The deployment runs Gunicorn bound to `0.0.0.0` on the `PORT` provided by Render. The page and assets are served by Flask, and the browser calls the Flask `/voices` and `/speak` routes. Speech is generated on the server, so the available voices depend on the speech engine installed in the deployment container.

## Routes

- `GET /` — application page
- `GET /voices` — server speech voices as JSON
- `POST /speak` — generate WAV audio from JSON text, voice, and rate
- `GET /health` — deployment health check

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
