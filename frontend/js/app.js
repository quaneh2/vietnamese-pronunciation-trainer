/**
 * Vietnamese Pronunciation Trainer - Main Application
 */

// Configuration
const API_BASE_URL = '/api';
const RECORDING_DURATION = 3000; // 3 seconds

// Application State
const state = {
    words: [],
    currentIndex: 0,
    isRecording: false,
    audioRecorder: null,
    isProcessing: false,
    recordedBlob: null
};

// DOM Elements
const elements = {
    currentWord: document.getElementById('current-word'),
    wordTranslation: document.getElementById('word-translation'),
    progressText: document.getElementById('progress-text'),
    progressFill: document.getElementById('progress-fill'),
    recordButton: document.getElementById('record-button'),
    recordingProgress: document.getElementById('recording-progress'),
    recordingFill: document.getElementById('recording-fill'),
    stopButton: document.getElementById('stop-button'),
    audioReview: document.getElementById('audio-review'),
    audioPlayback: document.getElementById('audio-playback'),
    submitButton: document.getElementById('submit-button'),
    rerecordButton: document.getElementById('rerecord-button'),
    nextButtonContainer: document.getElementById('next-button-container'),
    nextButton: document.getElementById('next-button'),
    feedbackArea: document.getElementById('feedback-area'),
    completionSection: document.getElementById('completion-section'),
    restartButton: document.getElementById('restart-button'),
    loadingOverlay: document.getElementById('loading-overlay'),
    wordCard: document.querySelector('.word-card')
};

/**
 * Initialize the application
 */
async function initApp() {
    try {
        console.log('Initializing Vietnamese Pronunciation Trainer...');

        // Initialize audio recorder
        state.audioRecorder = new AudioRecorder();

        // Check browser support
        if (!state.audioRecorder.isSupported()) {
            showError('Your browser does not support audio recording. Please use a modern browser like Chrome, Firefox, or Safari.');
            return;
        }

        // Request microphone permission
        try {
            await state.audioRecorder.requestPermission();
            console.log('Microphone permission granted');
        } catch (error) {
            showError('Microphone access is required. Please grant permission and reload the page.');
            elements.recordButton.disabled = true;
            return;
        }

        // Fetch words from API
        await fetchWords();

        // Display first word
        displayCurrentWord();
        updateProgress();

        // Setup event listeners
        setupEventListeners();

        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize application. Please reload the page.');
    }
}

/**
 * Fetch words from API
 */
async function fetchWords() {
    try {
        const response = await fetch(`${API_BASE_URL}/words`);
        const data = await response.json();

        if (data.words && data.words.length > 0) {
            state.words = data.words;
            console.log(`Loaded ${state.words.length} words`);
        } else {
            throw new Error('No words received from API');
        }
    } catch (error) {
        console.error('Error fetching words:', error);
        showError('Failed to load word list. Please reload the page.');
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    elements.recordButton.addEventListener('click', handleRecordClick);
    elements.stopButton.addEventListener('click', handleStopClick);
    elements.submitButton.addEventListener('click', handleSubmitClick);
    elements.rerecordButton.addEventListener('click', handleRerecordClick);
    elements.nextButton.addEventListener('click', handleNextWord);
    elements.restartButton.addEventListener('click', handleRestart);
}

/**
 * Display current word
 */
function displayCurrentWord() {
    const currentWordObj = state.words[state.currentIndex];
    elements.currentWord.textContent = currentWordObj.word;

    // Update translation if element exists
    if (elements.wordTranslation) {
        elements.wordTranslation.textContent = currentWordObj.translation;
    }

    // Reset word card styling
    elements.wordCard.classList.remove('success', 'error');
}

/**
 * Update progress indicator
 */
function updateProgress() {
    const current = state.currentIndex + 1;
    const total = state.words.length;
    const percentage = (current / total) * 100;

    elements.progressText.textContent = `Word ${current} of ${total}`;
    elements.progressFill.style.width = `${percentage}%`;
}

/**
 * Handle record button click
 */
async function handleRecordClick() {
    if (state.isRecording || state.isProcessing) {
        return;
    }

    try {
        // Update state
        state.isRecording = true;
        state.recordedBlob = null;

        // Update UI - hide record button, show recording progress
        elements.recordButton.style.display = 'none';
        elements.recordingProgress.style.display = 'block';
        elements.audioReview.style.display = 'none';
        elements.feedbackArea.innerHTML = '';
        elements.recordingFill.style.width = '0%';

        // Start recording with progress callback
        await state.audioRecorder.startRecording(
            // Progress callback
            (progress) => {
                elements.recordingFill.style.width = `${progress}%`;
            },
            // Completion callback
            (audioBlob, isAutoStop) => {
                handleRecordingComplete(audioBlob, isAutoStop);
            }
        );

    } catch (error) {
        console.error('Recording start error:', error);
        state.isRecording = false;
        elements.recordingProgress.style.display = 'none';
        elements.recordButton.style.display = 'inline-block';
        showError('Failed to start recording. Please try again.');
    }
}


/**
 * Handle stop button click
 */
async function handleStopClick() {
    if (!state.isRecording) {
        return;
    }

    console.log('Stopping recording manually...');

    // Stop the recording (this will trigger the onComplete callback)
    await state.audioRecorder.stopRecording(false);
}

/**
 * Handle recording completion (auto or manual)
 */
function handleRecordingComplete(audioBlob, isAutoStop) {
    try {
        if (!audioBlob || audioBlob.size === 0) {
            throw new Error('No audio recorded');
        }

        // Update state
        state.recordedBlob = audioBlob;
        state.isRecording = false;

        // Update UI - hide recording progress
        elements.recordingProgress.style.display = 'none';
        elements.recordingFill.style.width = '0%';

        // Show audio review panel
        showAudioReview(audioBlob);

    } catch (error) {
        console.error('Recording completion error:', error);

        // Reset state
        state.isRecording = false;

        // Reset UI
        elements.recordingProgress.style.display = 'none';
        elements.recordButton.style.display = 'inline-block';

        showError('Failed to complete recording. Please try again.');
    }
}

/**
 * Show audio review panel with playback
 */
function showAudioReview(blob) {
    // Create URL for audio playback
    const audioUrl = URL.createObjectURL(blob);
    elements.audioPlayback.src = audioUrl;

    // Show review panel
    elements.audioReview.style.display = 'block';

    // Clean up old URL when audio loads
    elements.audioPlayback.onloadeddata = () => {
        // Revoke old URLs to free memory
        if (elements.audioPlayback.src && elements.audioPlayback.src !== audioUrl) {
            URL.revokeObjectURL(elements.audioPlayback.src);
        }
    };
}

/**
 * Handle submit button click
 */
async function handleSubmitClick() {
    if (!state.recordedBlob || state.isProcessing) {
        return;
    }

    try {
        console.log('Converting and submitting audio...');

        // Show loading state
        showLoading(true);
        state.isProcessing = true;
        elements.submitButton.disabled = true;
        elements.rerecordButton.disabled = true;

        // Convert to WAV and encode
        const wavBlob = await state.audioRecorder.convertToWav(state.recordedBlob);
        const base64Audio = await state.audioRecorder.encodeToBase64(wavBlob);

        console.log('Sending to API...');

        // Check pronunciation
        await checkPronunciation(base64Audio);

    } catch (error) {
        console.error('Submit error:', error);
        showLoading(false);
        state.isProcessing = false;
        elements.submitButton.disabled = false;
        elements.rerecordButton.disabled = false;
        showError('Failed to process audio. Please try again.');
    }
}

/**
 * Handle re-record button click
 */
async function handleRerecordClick() {
    console.log('Re-recording...');

    // Clear recorded blob
    state.recordedBlob = null;

    // Cancel any ongoing recording
    if (state.isRecording) {
        state.audioRecorder.cancelRecording();
        state.isRecording = false;
    }

    // Revoke audio URL
    if (elements.audioPlayback.src) {
        URL.revokeObjectURL(elements.audioPlayback.src);
        elements.audioPlayback.src = '';
    }

    // Reset UI - hide everything, show only record button
    elements.audioReview.style.display = 'none';
    elements.recordingProgress.style.display = 'none';
    elements.recordButton.style.display = 'inline-block';
    elements.recordingFill.style.width = '0%';

    // Reset buttons
    elements.submitButton.disabled = false;
    elements.rerecordButton.disabled = false;

    // Start a new recording
    await handleRecordClick();
}

/**
 * Check pronunciation via API
 */
async function checkPronunciation(base64Audio) {
    const currentWordObj = state.words[state.currentIndex];

    try {
        const response = await fetch(`${API_BASE_URL}/check-pronunciation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                audio_data: base64Audio,
                expected_word: currentWordObj.word,
                language: 'vi-VN'
            })
        });

        const result = await response.json();

        console.log('API response:', result);

        // Hide loading and audio review
        showLoading(false);
        state.isProcessing = false;
        elements.submitButton.disabled = false;
        elements.rerecordButton.disabled = false;
        elements.audioReview.style.display = 'none';

        // Show feedback
        if (result.success && result.correct) {
            showCorrectFeedback(result);
        } else {
            showIncorrectFeedback(result);
        }

    } catch (error) {
        console.error('API error:', error);
        showLoading(false);
        state.isProcessing = false;
        elements.submitButton.disabled = false;
        elements.rerecordButton.disabled = false;
        showError('Failed to check pronunciation. Please try again.');
    }
}

/**
 * Show correct pronunciation feedback
 */
function showCorrectFeedback(result) {
    elements.wordCard.classList.add('success');

    const feedback = document.createElement('div');
    feedback.className = 'feedback-message success';
    feedback.innerHTML = `
        <span class="feedback-icon">✓</span>
        <h3>Correct!</h3>
        <p>Great job! You pronounced "${result.recognized}" correctly.</p>
    `;

    elements.feedbackArea.innerHTML = '';
    elements.feedbackArea.appendChild(feedback);

    // Show next button
    elements.nextButtonContainer.style.display = 'block';
    elements.recordButton.style.display = 'none';
}

/**
 * Show incorrect pronunciation feedback
 */
function showIncorrectFeedback(result) {
    elements.wordCard.classList.add('error');

    const feedback = document.createElement('div');
    feedback.className = 'feedback-message error';

    let message = 'Try again';
    if (result.recognized) {
        message = `You said: "${result.recognized}", expected: "${state.words[state.currentIndex].word}"`;
    } else if (result.message) {
        message = result.message;
    }

    feedback.innerHTML = `
        <span class="feedback-icon">✗</span>
        <h3>Try Again</h3>
        <p>${message}</p>
    `;

    elements.feedbackArea.innerHTML = '';
    elements.feedbackArea.appendChild(feedback);

    // Keep record button visible for retry
    elements.recordButton.style.display = 'inline-block';
    elements.nextButtonContainer.style.display = 'none';
}

/**
 * Show error message
 */
function showError(message) {
    const feedback = document.createElement('div');
    feedback.className = 'feedback-message error';
    feedback.innerHTML = `
        <span class="feedback-icon">⚠</span>
        <h3>Error</h3>
        <p>${message}</p>
    `;

    elements.feedbackArea.innerHTML = '';
    elements.feedbackArea.appendChild(feedback);
}

/**
 * Handle next word button click
 */
function handleNextWord() {
    state.currentIndex++;

    // Check if completed all words
    if (state.currentIndex >= state.words.length) {
        showCompletion();
        return;
    }

    // Clear any recording state
    if (state.isRecording) {
        state.audioRecorder.cancelRecording();
        state.isRecording = false;
    }

    // Reset UI
    elements.feedbackArea.innerHTML = '';
    elements.recordButton.style.display = 'inline-block';
    elements.recordingProgress.style.display = 'none';
    elements.audioReview.style.display = 'none';
    elements.nextButtonContainer.style.display = 'none';
    elements.recordingFill.style.width = '0%';

    // Clean up audio
    if (elements.audioPlayback.src) {
        URL.revokeObjectURL(elements.audioPlayback.src);
        elements.audioPlayback.src = '';
    }
    state.recordedBlob = null;

    // Display next word
    displayCurrentWord();
    updateProgress();
}

/**
 * Show completion screen
 */
function showCompletion() {
    elements.completionSection.style.display = 'block';
    document.querySelector('.progress-section').style.display = 'none';
    document.querySelector('.letter-display').style.display = 'none';
    document.querySelector('.controls').style.display = 'none';
    elements.feedbackArea.style.display = 'none';
}

/**
 * Handle restart button click
 */
function handleRestart() {
    // Reset state
    state.currentIndex = 0;
    state.recordedBlob = null;

    // Clear any recording state
    if (state.isRecording) {
        state.audioRecorder.cancelRecording();
        state.isRecording = false;
    }

    // Clean up audio
    if (elements.audioPlayback.src) {
        URL.revokeObjectURL(elements.audioPlayback.src);
        elements.audioPlayback.src = '';
    }

    // Reset UI
    elements.completionSection.style.display = 'none';
    document.querySelector('.progress-section').style.display = 'block';
    document.querySelector('.letter-display').style.display = 'block';
    document.querySelector('.controls').style.display = 'flex';
    elements.feedbackArea.style.display = 'block';
    elements.feedbackArea.innerHTML = '';
    elements.recordButton.style.display = 'inline-block';
    elements.recordingProgress.style.display = 'none';
    elements.audioReview.style.display = 'none';
    elements.nextButtonContainer.style.display = 'none';
    elements.recordingFill.style.width = '0%';

    // Display first word
    displayCurrentWord();
    updateProgress();
}

/**
 * Show/hide loading overlay
 */
function showLoading(show) {
    elements.loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
