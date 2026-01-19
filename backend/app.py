"""Vietnamese Pronunciation Trainer - Flask Backend API."""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging
import os

from pronunciation_checker import SpeechRecognizer
from vietnamese_words import get_all_words
import config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=config.CORS_ORIGINS)

# Initialize speech recognizer
speech_recognizer = SpeechRecognizer(language=config.SPEECH_LANGUAGE)

# Load Vietnamese words data
vietnamese_words = get_all_words()


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint.

    Returns:
        JSON response with service status
    """
    return jsonify({
        'status': 'healthy',
        'service': 'Vietnamese Pronunciation Trainer'
    })


@app.route('/api/words', methods=['GET'])
def get_words():
    """Get list of Vietnamese words with translations.

    Returns:
        JSON response with words array and total count
    """
    return jsonify({
        'words': vietnamese_words,
        'total': len(vietnamese_words)
    })


@app.route('/api/check-pronunciation', methods=['POST'])
def check_pronunciation():
    """Check pronunciation against expected word.

    Expected JSON body:
        {
            "audio_data": "<base64 encoded audio>",
            "expected_word": "cá",
            "language": "vi-VN"
        }

    Returns:
        JSON response with:
        - success (bool): Whether recognition succeeded
        - correct (bool): Whether pronunciation is correct
        - recognized (str): What was recognized
        - confidence (float): Confidence score
        - message (str): User-friendly message
    """
    try:
        # Parse request data
        data = request.get_json()

        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided',
                'message': 'Invalid request'
            }), 400

        # Validate required fields
        audio_data = data.get('audio_data')
        expected_word = data.get('expected_word')

        if not audio_data:
            return jsonify({
                'success': False,
                'error': 'Missing audio_data',
                'message': 'No audio data provided'
            }), 400

        if not expected_word:
            return jsonify({
                'success': False,
                'error': 'Missing expected_word',
                'message': 'No expected word provided'
            }), 400

        logger.info(f"Checking pronunciation for word: {expected_word}")

        # Check pronunciation
        result = speech_recognizer.check_pronunciation(audio_data, expected_word)

        # Return result
        status_code = 200 if result.get('success') else 400
        return jsonify(result), status_code

    except Exception as e:
        logger.error(f"Error in check_pronunciation endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'An error occurred processing your request'
        }), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found',
        'message': 'The requested endpoint does not exist'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'success': False,
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500


if __name__ == '__main__':
    logger.info(f"Starting Vietnamese Pronunciation Trainer API on {config.HOST}:{config.PORT}")
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
