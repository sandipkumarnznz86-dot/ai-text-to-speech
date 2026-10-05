# Voxly AI

Voxly AI is a simple Python-based text-to-speech assistant that converts user-entered text into spoken audio.

## Features

- Text-to-speech
- Simple modern interface
- Speech controls
- Voice settings
- Character counter
- Responsive design
- No login required
- No database required
- Easy to run locally

## Technologies

- Python
- Flask
- pyttsx3
- HTML5
- CSS3
- JavaScript

## Project Structure

```text
voxly-ai/
├── app.py
├── requirements.txt
├── README.md
├── LICENSE
├── .gitignore
├── templates/
│   └── index.html
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── script.js
└── screenshots/
    └── voxly-ai.png  (add your screenshot here)
```

## Installation

Clone the repository and enter its folder:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd voxly-ai
```

Create and activate a virtual environment:

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

Install the dependencies:

```bash
pip install -r requirements.txt
```

## Run the Application

Start the local Flask server:

```bash
python app.py
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser.

Voxly uses the voices available on the computer running the Flask server. The generated audio is sent to the browser for playback. The first request may take a moment while the local speech engine initializes.

## How It Works

```text
User enters text
       ↓
Frontend sends text
       ↓
Flask backend
       ↓
Python Text-to-Speech
       ↓
Speech generated
       ↓
User hears the text
```

## Screenshot

![Voxly AI Screenshot](screenshots/voxly-ai.png)

Add a screenshot at `screenshots/voxly-ai.png` when one is ready.

## Future Improvements

- Multiple languages
- More voice options
- Better voice controls
- Download generated audio
- AI-generated responses
- Voice input
- Conversation mode

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
