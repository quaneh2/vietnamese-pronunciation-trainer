# Vietnamese Pronunciation Trainer

A web-based application that helps users learn Vietnamese word pronunciation through interactive voice recognition. The app displays Vietnamese words with English translations, records user pronunciation, and provides immediate feedback using speech-to-text technology.

## Features

- **91 Vietnamese Words**: Practice common 2-3 character Vietnamese words with English translations
- **Real-time Voice Recognition**: Uses Google Speech Recognition API to analyze pronunciation
- **Immediate Feedback**: Get instant feedback on pronunciation accuracy
- **Progress Tracking**: Visual progress indicator showing your position through the word list
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Clean, Literary Design**: Follows the Portfolio Design System for elegant, readable interfaces

## Technology Stack

### Backend
- **Flask**: Python web framework
- **Google Speech Recognition API**: For Vietnamese pronunciation recognition
- **Flask-CORS**: Cross-origin resource sharing support

### Frontend
- **Vanilla JavaScript**: No frameworks, pure ES6+
- **Web Audio API**: Browser-based audio recording
- **CSS3**: Custom styling following Portfolio Design System
- **HTML5**: Semantic structure

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+**: [Download Python](https://www.python.org/downloads/)
- **pip**: Python package installer (comes with Python)
- **Modern Web Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
- **Microphone**: Required for voice recording

## Installation

### 1. Clone or Download the Project

```bash
cd vietnamese-pronunciation-trainer
```

### 2. Set Up Python Virtual Environment (Recommended)

Navigate to the backend directory and create a virtual environment:

```bash
cd backend
python3 -m venv venv
```

Activate the virtual environment:

**macOS/Linux:**
```bash
source venv/bin/activate
```

**Windows:**
```bash
venv\Scripts\activate
```

You should see `(venv)` in your terminal prompt.

### 3. Install Backend Dependencies

With the virtual environment activated, install Python packages:

```bash
pip install -r requirements.txt
```

### 4. Verify Installation

Check that all packages installed correctly:

```bash
pip list | grep -E "Flask|SpeechRecognition"
```

You should see:
- Flask (3.0.0)
- Flask-CORS (4.0.0)
- SpeechRecognition (3.10.0)

## Running the Application

### Start the Backend Server

**Option 1: Using the start script (recommended)**

From the `backend` directory:

```bash
./start.sh
```

This script automatically activates the virtual environment and starts the Flask server.

**Option 2: Manual start**

Activate the virtual environment and run the app:

**macOS/Linux:**
```bash
cd backend
source venv/bin/activate
python app.py
```

**Windows:**
```bash
cd backend
venv\Scripts\activate
python app.py
```

You should see output like:

```
INFO:__main__:Starting Vietnamese Pronunciation Trainer API on 0.0.0.0:5000
 * Running on http://0.0.0.0:5000
```

The backend API is now running on **http://localhost:5000**

**Note:** Keep this terminal window open while using the app. To stop the server, press `Ctrl+C`.

### Start the Frontend Server

Open a **new terminal window** and navigate to the `frontend` directory:

```bash
cd frontend
python -m http.server 3000
```

**Note for macOS/Linux**: Use `python3`:

```bash
python3 -m http.server 3000
```

You should see:

```
Serving HTTP on 0.0.0.0 port 3000 (http://0.0.0.0:3000/) ...
```

The frontend is now running on **http://localhost:3000**

### Access the Application

Open your web browser and navigate to:

```
http://localhost:3000
```

When prompted, **allow microphone access** - this is required for the app to work.

## How to Use

### 1. Grant Microphone Permission
When you first open the app, your browser will ask for microphone permission. Click **Allow**.

### 2. View the Current Word
The app displays one Vietnamese word at a time with its English translation.

### 3. Record Your Pronunciation
- Click the **Record** button
- The button will change to "Recording..." and turn red
- Speak the word clearly into your microphone
- Recording automatically stops after 3 seconds

### 4. Receive Feedback
- **Correct**: Green checkmark, "Correct!" message, and a **Next** button appears
- **Incorrect**: Red X, "Try again" message showing what you said vs. what was expected

### 5. Progress Through Words
- If correct, click **Next Word** to move to the next word
- If incorrect, click **Record** again to retry
- Continue until you complete all 91 words

### 6. Completion
After completing all words, you'll see a congratulations message with an option to **Start Over**.

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### GET /api/health
Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "Vietnamese Pronunciation Trainer"
}
```

#### GET /api/words
Get the list of Vietnamese words with translations.

**Response:**
```json
{
  "words": [
    {"word": "ba", "translation": "three / father"},
    {"word": "bà", "translation": "grandmother"},
    ...
  ],
  "total": 91
}
```

#### POST /api/check-pronunciation
Check pronunciation against expected word.

**Request Body:**
```json
{
  "audio_data": "<base64 encoded audio>",
  "expected_word": "ba",
  "language": "vi-VN"
}
```

**Success Response:**
```json
{
  "success": true,
  "correct": true,
  "recognized": "ba",
  "confidence": 0.95,
  "message": "Correct!"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Could not understand audio",
  "message": "Please try again"
}
```

## Troubleshooting

### Microphone Not Working

**Problem**: Browser doesn't request microphone permission or recording fails.

**Solutions**:
- Ensure you're accessing the app via `http://localhost:3000` (not file://)
- Check browser microphone permissions in Settings
- Try a different browser (Chrome recommended)
- Restart your browser

### Backend API Errors

**Problem**: API returns errors or doesn't respond.

**Solutions**:
- Verify Python packages are installed: `pip list`
- Check that port 5000 is not in use: `lsof -i :5000` (macOS/Linux) or `netstat -ano | findstr :5000` (Windows)
- Review backend console for error messages
- Ensure `vietnamese_words.py` file exists in `backend/`

### Speech Recognition Not Working

**Problem**: API always returns "Could not understand audio".

**Solutions**:
- Speak clearly and at normal volume
- Reduce background noise
- Check your internet connection (Google Speech API requires internet)
- Ensure you're pronouncing Vietnamese words correctly
- Try increasing microphone volume in system settings

### CORS Errors

**Problem**: Browser console shows CORS-related errors.

**Solutions**:
- Ensure backend is running on port 5000
- Ensure frontend is running on port 3000
- Check `backend/config.py` CORS_ORIGINS includes your frontend URL
- Restart both backend and frontend servers

### Port Already in Use

**Problem**: "Address already in use" error when starting servers.

**Solutions**:

For backend (port 5000):
```bash
# macOS/Linux
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

For frontend (port 3000):
```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Project Structure

```
vietnamese-pronunciation-trainer/
├── backend/
│   ├── app.py                   # Main Flask application
│   ├── pronunciation_checker.py # Speech recognition logic
│   ├── vietnamese_words.py      # Vietnamese words data
│   ├── config.py                # Configuration settings
│   ├── requirements.txt         # Python dependencies
│   ├── start.sh                 # Startup script (venv + Flask)
│   └── venv/                    # Python virtual environment
├── frontend/
│   ├── index.html              # Main HTML file
│   ├── css/
│   │   └── style.css           # Stylesheet (Portfolio Design System)
│   └── js/
│       ├── app.js              # Main application logic
│       └── audioRecorder.js    # Audio recording functionality
├── specs/
│   ├── project_spec.md         # Project specification
│   └── design_spec.md          # Portfolio Design System
├── README.md                   # This file
├── QUICK_START.md              # Quick start guide
└── .gitignore                  # Git ignore file
```

## Design System

This project follows the **Portfolio Design System Specification** for visual design:

- **Typography**: Georgia serif for body text, system sans-serif for UI elements
- **Colors**: Near-black (#1a1a1a) on white with minimal accent colors
- **Spacing**: 8px grid system for mathematical harmony
- **Accessibility**: WCAG AA compliant with 4.5:1 contrast ratios
- **Responsive**: Mobile-first design with breakpoints at 768px and 1024px

For full design details, see [specs/design_spec.md](specs/design_spec.md).

## Browser Compatibility

Tested and working on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Note**: Internet Explorer is not supported.

## Future Enhancements

Potential features for future versions:

- **Longer Words**: Support for 4+ character words and phrases
- **Sentence Practice**: Practice full Vietnamese sentences
- **Progress Persistence**: Save progress using localStorage
- **User Accounts**: Track statistics and learning history
- **Audio Playback**: Hear correct pronunciation examples
- **Difficulty Levels**: Beginner, intermediate, advanced modes
- **Spaced Repetition**: Smart review system for better retention
- **Word Categories**: Group words by topic (animals, family, colors, etc.)

## License

This project is created for educational purposes.

## Contributing

This is a learning project. Feel free to fork and modify for your own use.

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review the console logs in your browser (F12 → Console)
3. Check the backend terminal for error messages

## Acknowledgments

- **Design Inspiration**: The Paris Review, The New Yorker
- **Speech Recognition**: Google Speech Recognition API
- **Design System**: Portfolio Design System Specification

---

**Happy Learning! 🇻🇳**

Practice daily for best results. Consistency is key to mastering pronunciation.
