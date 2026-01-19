# Quick Start Guide

## First Time Setup

### 1. Install Backend Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

The virtual environment has already been created and dependencies installed!

## Running the Application

### Terminal 1: Start Backend

```bash
cd backend
./start.sh
```

You should see:
```
INFO:__main__:Starting Vietnamese Pronunciation Trainer API on 0.0.0.0:5000
 * Running on http://0.0.0.0:5000
```

### Terminal 2: Start Frontend

```bash
cd frontend
python3 -m http.server 3000
```

You should see:
```
Serving HTTP on 0.0.0.0 port 3000 (http://0.0.0.0:3000/) ...
```

### Open Browser

Navigate to: **http://localhost:3000**

Allow microphone access when prompted.

## Stopping the Application

- Press `Ctrl+C` in each terminal window
- The backend virtual environment will deactivate automatically

## Troubleshooting

**Backend won't start?**
- Make sure you're in the `backend` directory
- Try: `source venv/bin/activate && python app.py`

**Frontend won't start?**
- Make sure port 3000 is not in use
- Try a different port: `python3 -m http.server 8000`
- Update frontend in `js/app.js` if you change ports

**Microphone not working?**
- Check browser permissions (click padlock icon in address bar)
- Ensure you're using HTTPS or localhost
- Try Chrome or Firefox

## Features

- Record pronunciation of short Vietnamese words
- Get instant feedback (correct/incorrect)
- Restart anytime

Enjoy learning Vietnamese! 🇻🇳
