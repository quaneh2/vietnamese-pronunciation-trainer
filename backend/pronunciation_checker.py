"""Speech recognition module for Vietnamese pronunciation checking."""

import speech_recognition as sr
from google.cloud import speech_v1
import base64
import io
import wave
import logging
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class SpeechRecognizer:
    """Handles speech recognition for Vietnamese pronunciation."""

    def __init__(self, language='vi-VN'):
        """Initialize the speech recognizer.

        Args:
            language (str): Language code for recognition (default: vi-VN)
        """
        self.recognizer = sr.Recognizer()
        self.language = language

        # Check for API key first (simpler option)
        self.api_key = os.getenv('GOOGLE_CLOUD_API_KEY')
        self.speech_client = None
        self.use_cloud_api = False

        if self.api_key:
            # Using REST API with API key
            self.use_cloud_api = True
            self.use_rest_api = True
            logger.info("Google Cloud API key found - using REST API with phrase hints")
        else:
            # Try service account credentials
            try:
                self.speech_client = speech_v1.SpeechClient()
                self.use_cloud_api = True
                self.use_rest_api = False
                logger.info("Google Cloud Speech API initialized with service account")
            except Exception as e:
                logger.warning(f"Could not initialize Google Cloud Speech API: {e}")
                logger.info("Falling back to basic speech_recognition library")
                self.use_rest_api = False

    def decode_audio(self, base64_audio):
        """Decode base64 audio data to audio file.

        Args:
            base64_audio (str): Base64 encoded audio data (WAV format)

        Returns:
            sr.AudioData: Audio data object for recognition

        Raises:
            ValueError: If audio decoding fails
        """
        try:
            # Decode base64 to bytes
            audio_bytes = base64.b64decode(base64_audio)
            logger.info(f"Decoded audio size: {len(audio_bytes)} bytes")

            # Check WAV header
            if len(audio_bytes) < 44:
                raise ValueError("Audio data too small to be valid WAV file")

            # Verify RIFF header
            riff_header = audio_bytes[0:4].decode('ascii', errors='ignore')
            wave_header = audio_bytes[8:12].decode('ascii', errors='ignore')
            logger.info(f"Audio headers: RIFF={riff_header}, WAVE={wave_header}")

            if riff_header != 'RIFF' or wave_header != 'WAVE':
                raise ValueError(f"Invalid WAV headers: {riff_header}/{wave_header}")

            # Create audio file object from WAV bytes
            audio_file = io.BytesIO(audio_bytes)

            # Read WAV file
            with sr.AudioFile(audio_file) as source:
                logger.info(f"WAV file opened: sample_rate={source.SAMPLE_RATE}, sample_width={source.SAMPLE_WIDTH}")
                audio_data = self.recognizer.record(source)

            logger.info(f"Audio successfully decoded, duration: ~{len(audio_data.frame_data) / (source.SAMPLE_RATE * source.SAMPLE_WIDTH):.2f}s")
            return audio_data

        except Exception as e:
            logger.error(f"Error decoding audio: {str(e)}")
            raise ValueError(f"Failed to decode audio data: {str(e)}")

    def recognize_speech_rest_api(self, audio_bytes, expected_word=None):
        """Recognize speech using Google Cloud REST API with API key and phrase hints.

        Args:
            audio_bytes (bytes): Raw audio bytes (WAV format)
            expected_word (str, optional): Expected word for phrase hints

        Returns:
            tuple: (recognized_text, confidence)

        Raises:
            Exception: If speech is not understood or API error
        """
        # Use expected word as phrase hint
        phrase_hints = [expected_word] if expected_word else []
        logger.info(f"Using REST API with phrase hint: '{expected_word}'")

        # Encode audio to base64
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

        # Build request payload
        payload = {
            "config": {
                "encoding": "LINEAR16",
                "sampleRateHertz": 16000,
                "languageCode": self.language,
                "speechContexts": [{
                    "phrases": phrase_hints,
                    "boost": 20
                }] if phrase_hints else [],
                "useEnhanced": True,
                "enableAutomaticPunctuation": False,
                "maxAlternatives": 1,
                "profanityFilter": False
            },
            "audio": {
                "content": audio_base64
            }
        }

        # Make REST API request
        url = f"https://speech.googleapis.com/v1/speech:recognize?key={self.api_key}"
        response = requests.post(url, json=payload)

        if response.status_code != 200:
            logger.error(f"REST API error: {response.status_code} - {response.text}")
            raise Exception(f"API request failed: {response.status_code}")

        result = response.json()
        logger.info(f"REST API response: {result}")

        if 'results' in result and result['results']:
            alternatives = result['results'][0].get('alternatives', [])
            if alternatives:
                alternative = alternatives[0]
                text = alternative.get('transcript', '').lower().strip()
                confidence = alternative.get('confidence', 0.0)
                logger.info(f"Recognized: '{text}' with confidence {confidence}")
                return text, confidence

        raise sr.UnknownValueError("No speech recognized")

    def recognize_speech_cloud_api(self, audio_bytes, expected_word=None):
        """Recognize speech using Google Cloud Speech API with phrase hints (service account).

        Args:
            audio_bytes (bytes): Raw audio bytes (WAV format)
            expected_word (str, optional): Expected word for phrase hints

        Returns:
            tuple: (recognized_text, confidence)

        Raises:
            Exception: If speech is not understood or API error
        """
        # Use expected word as phrase hint
        phrase_hints = [expected_word] if expected_word else []
        logger.info(f"Using Cloud API with phrase hint: '{expected_word}'")

        # Configure speech context with phrase hints
        speech_contexts = []
        if phrase_hints:
            speech_context = speech_v1.SpeechContext(
                phrases=phrase_hints,
                boost=20
            )
            speech_contexts = [speech_context]

        # Configure recognition
        config = speech_v1.RecognitionConfig(
            encoding=speech_v1.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code=self.language,
            speech_contexts=speech_contexts,
            use_enhanced=True,
            enable_automatic_punctuation=False,
            max_alternatives=1,
            profanity_filter=False
        )

        audio = speech_v1.RecognitionAudio(content=audio_bytes)

        # Perform recognition
        response = self.speech_client.recognize(config=config, audio=audio)

        logger.info(f"Cloud API response: {response}")

        if response.results:
            result = response.results[0]
            if result.alternatives:
                alternative = result.alternatives[0]
                text = alternative.transcript.lower().strip()
                confidence = alternative.confidence
                logger.info(f"Recognized: '{text}' with confidence {confidence}")
                return text, confidence

        raise sr.UnknownValueError("No speech recognized")

    def recognize_speech(self, audio_data, expected_word=None):
        """Recognize speech from audio data.

        Args:
            audio_data (sr.AudioData): Audio data to recognize
            expected_word (str, optional): Expected word for phrase hints

        Returns:
            tuple: (recognized_text, confidence)

        Raises:
            sr.UnknownValueError: If speech is not understood
            sr.RequestError: If the API is unavailable
        """
        try:
            logger.info(f"Attempting speech recognition with language: {self.language}")

            # Try using Cloud API if available (supports phrase hints)
            if self.use_cloud_api:
                try:
                    if self.use_rest_api:
                        # Use REST API with API key
                        return self.recognize_speech_rest_api(audio_data.frame_data, expected_word)
                    else:
                        # Use client library with service account
                        return self.recognize_speech_cloud_api(audio_data.frame_data, expected_word)
                except Exception as cloud_error:
                    logger.warning(f"Cloud API failed: {cloud_error}, falling back to basic API")
                    # Fall through to basic API

            # Fallback to basic Google Speech Recognition (no phrase hints)
            result = self.recognizer.recognize_google(
                audio_data,
                language=self.language,
                show_all=True
            )

            logger.info(f"Google API raw result: {result}")

            if result and 'alternative' in result:
                # Get best match
                best_match = result['alternative'][0]
                text = best_match.get('transcript', '').lower().strip()
                confidence = best_match.get('confidence', 0.0)

                logger.info(f"Recognized: '{text}' with confidence {confidence}")
                return text, confidence
            else:
                logger.warning("Google returned empty result")
                raise sr.UnknownValueError("No speech recognized")

        except sr.UnknownValueError as e:
            logger.warning(f"Could not understand audio: {str(e)}")
            # Try again with English as fallback to test if API is working
            try:
                logger.info("Attempting fallback recognition with English...")
                fallback_result = self.recognizer.recognize_google(
                    audio_data,
                    language='en-US',
                    show_all=True
                )
                logger.info(f"English fallback result: {fallback_result}")
            except Exception as fallback_error:
                logger.info(f"English fallback also failed: {fallback_error}")
            raise
        except sr.RequestError as e:
            logger.error(f"Speech recognition service error: {str(e)}")
            raise

    def check_pronunciation(self, base64_audio, expected_word):
        """Check if pronunciation matches expected word.

        Args:
            base64_audio (str): Base64 encoded audio data
            expected_word (str): Expected Vietnamese word

        Returns:
            dict: Result containing:
                - success (bool): Whether recognition succeeded
                - correct (bool): Whether pronunciation is correct
                - recognized (str): What was recognized
                - confidence (float): Confidence score
                - message (str): User-friendly message
        """
        try:
            # Decode audio
            audio_data = self.decode_audio(base64_audio)

            # Recognize speech with expected word as phrase hint
            recognized_text, confidence = self.recognize_speech(audio_data, expected_word)

            # Normalize for comparison
            expected_normalized = expected_word.lower().strip()
            recognized_normalized = recognized_text.lower().strip()

            # Clean up repeated words (e.g., "ba ba ba" -> "ba")
            # Check if the recognized text contains spaces (multiple words)
            if ' ' in recognized_normalized:
                words = recognized_normalized.split()
                # If all words are the same, replace with single word
                if len(words) > 0 and all(word == words[0] for word in words):
                    logger.info(f"Detected repeated word pattern: '{recognized_normalized}' -> '{words[0]}'")
                    recognized_normalized = words[0]

            # Check if correct - exact match after cleanup
            is_correct = recognized_normalized == expected_normalized

            return {
                'success': True,
                'correct': is_correct,
                'recognized': recognized_normalized,  # Return cleaned up version
                'confidence': confidence,
                'message': 'Correct!' if is_correct else 'Try again'
            }

        except sr.UnknownValueError:
            return {
                'success': False,
                'error': 'Could not understand audio',
                'message': 'Please try again - speak clearly'
            }

        except sr.RequestError as e:
            return {
                'success': False,
                'error': f'Speech recognition service error: {str(e)}',
                'message': 'Service temporarily unavailable'
            }

        except ValueError as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Invalid audio data'
            }

        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return {
                'success': False,
                'error': f'Unexpected error: {str(e)}',
                'message': 'An error occurred. Please try again'
            }
