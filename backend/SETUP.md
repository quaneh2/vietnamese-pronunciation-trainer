# Backend Setup Guide

## Google Cloud Speech-to-Text API Setup

This application uses Google Cloud Speech-to-Text API with phrase hints for improved recognition in Vietnamese.

## API Key

### Steps to Set Up:

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable the Speech-to-Text API**
   - In your project, go to "APIs & Services" > "Library"
   - Search for "Cloud Speech-to-Text API"
   - Click "Enable"

3. **Enable Billing**
   - Go to "Billing" in the menu
   - Link a billing account to your project (required for Speech-to-Text API)

4. **Create an API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key
   - **Recommended**: Click "Restrict Key" and:
     - Under "API restrictions", select "Restrict key"
     - Choose "Cloud Speech-to-Text API"
     - Click "Save"

5. **Configure the Environment Variable**
   - Open the `.env` file in the `backend` directory
   - Paste your API key:
     ```
     GOOGLE_CLOUD_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
     ```

6. **Restart the Backend Server**
   - Stop your Flask server (Ctrl+C)
   - Start it again
   - You should see "Google Cloud API key found - using REST API with phrase hints" in the logs

---

## Fallback Behavior

If Google Cloud credentials are not configured:
- The app automatically falls back to basic Google Speech Recognition API
- This works but **does not support phrase hints**, so recognition will be less accurate
- You'll see: "Falling back to basic speech_recognition library" in the logs

## Testing

To verify the setup is working:
1. Start the backend server
2. Check the logs for:
   - API Key: "Google Cloud API key found - using REST API with phrase hints"
   - OR Service Account: "Google Cloud Speech API initialized with service account"
3. Record a word in the app
4. Check the backend logs for: "Using REST API with phrase hints" or "Using Cloud API with phrase hints"

## Troubleshooting

### API Key Issues

**Error: "API request failed: 400"**
- Check that your API key is correct and not truncated
- Verify the Speech-to-Text API is enabled
- Ensure billing is enabled on your project

**Error: "API request failed: 403"**
- Your API key might be restricted incorrectly
- Go to Credentials, edit your key, and ensure Cloud Speech-to-Text API is allowed
