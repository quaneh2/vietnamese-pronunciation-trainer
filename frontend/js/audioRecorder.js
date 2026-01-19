/**
 * Audio Recorder Module
 * Handles browser-based audio recording with 3-second countdown timer
 */

class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;
        this.recordingTimer = null;
        this.recordingStartTime = null;
        this.progressCallback = null;
        this.onComplete = null;
        this.maxDuration = 3000; // 3 seconds in milliseconds
    }

    /**
     * Check if browser supports audio recording
     * @returns {boolean} True if supported
     */
    isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    /**
     * Request microphone permission and initialize recorder
     * @returns {Promise<boolean>} True if permission granted
     */
    async requestPermission() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });
            return true;
        } catch (error) {
            console.error('Microphone permission denied:', error);
            throw new Error('Microphone access is required for this application');
        }
    }

    /**
     * Start recording audio with automatic 3-second limit
     * @param {Function} progressCallback - Called periodically with progress (0-100)
     * @param {Function} onComplete - Called when recording completes (auto or manual)
     */
    async startRecording(progressCallback, onComplete) {
        if (!this.stream) {
            await this.requestPermission();
        }

        this.audioChunks = [];
        this.progressCallback = progressCallback;
        this.onComplete = onComplete;
        this.recordingStartTime = Date.now();

        // Create MediaRecorder with WAV-compatible format
        const options = {
            mimeType: 'audio/webm;codecs=opus'
        };

        try {
            this.mediaRecorder = new MediaRecorder(this.stream, options);
        } catch (e) {
            // Fallback for browsers that don't support the specified format
            this.mediaRecorder = new MediaRecorder(this.stream);
        }

        // Collect audio data
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };

        // Handle errors
        this.mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event.error);
            this.stopRecording();
        };

        // Start recording
        this.mediaRecorder.start();

        // Start progress updates and auto-stop timer
        this.startProgressUpdates();
    }

    /**
     * Start progress bar updates and auto-stop timer
     */
    startProgressUpdates() {
        // Update progress every 50ms
        this.recordingTimer = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const progress = Math.min((elapsed / this.maxDuration) * 100, 100);

            // Call progress callback
            if (this.progressCallback) {
                this.progressCallback(progress);
            }

            // Auto-stop when time limit reached
            if (elapsed >= this.maxDuration) {
                this.stopRecording(true);
            }
        }, 50);
    }

    /**
     * Stop recording and return audio blob
     * @param {boolean} isAutoStop - True if stopped automatically by timer
     * @returns {Promise<Blob>} Recorded audio blob
     */
    stopRecording(isAutoStop = false) {
        return new Promise((resolve) => {
            // Clear the timer
            if (this.recordingTimer) {
                clearInterval(this.recordingTimer);
                this.recordingTimer = null;
            }

            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                resolve(null);
                return;
            }

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

                // Call completion callback
                if (this.onComplete) {
                    this.onComplete(audioBlob, isAutoStop);
                }

                resolve(audioBlob);
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * Check if currently recording
     * @returns {boolean} True if recording in progress
     */
    isRecording() {
        return this.mediaRecorder && this.mediaRecorder.state === 'recording';
    }

    /**
     * Cancel ongoing recording without saving
     */
    cancelRecording() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }

        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }

        this.audioChunks = [];
    }

    /**
     * Convert audio blob to WAV format using Web Audio API
     * @param {Blob} blob - Audio blob to convert
     * @returns {Promise<Blob>} WAV formatted blob
     */
    async convertToWav(blob) {
        try {
            // Create an AudioContext
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Read the blob as array buffer
            const arrayBuffer = await blob.arrayBuffer();

            // Decode the audio data
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Convert to WAV format
            const wavBlob = this.audioBufferToWav(audioBuffer);

            // Close the audio context
            audioContext.close();

            return wavBlob;
        } catch (error) {
            console.error('WAV conversion error:', error);
            // Fallback: return original blob
            return blob;
        }
    }

    /**
     * Convert AudioBuffer to WAV blob
     * @param {AudioBuffer} audioBuffer - Audio buffer to convert
     * @returns {Blob} WAV formatted blob
     */
    audioBufferToWav(audioBuffer) {
        const numChannels = 1; // Mono
        const targetSampleRate = 16000; // Resample to 16kHz for speech recognition
        const format = 1; // PCM
        const bitDepth = 16;

        // Resample audio to 16kHz if needed
        const audioData = this.resampleAudio(audioBuffer, targetSampleRate);
        const dataLength = audioData.length * 2; // 2 bytes per sample (16-bit)

        // Create WAV file buffer
        const wavBuffer = new ArrayBuffer(44 + dataLength);
        const view = new DataView(wavBuffer);

        // Write WAV header (RIFF chunk descriptor)
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true); // File size - 8
        this.writeString(view, 8, 'WAVE');

        // Write fmt sub-chunk
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
        view.setUint16(20, format, true); // AudioFormat (1 = PCM)
        view.setUint16(22, numChannels, true); // NumChannels (1 = Mono)
        view.setUint32(24, targetSampleRate, true); // SampleRate (16000 Hz)
        view.setUint32(28, targetSampleRate * numChannels * bitDepth / 8, true); // ByteRate
        view.setUint16(32, numChannels * bitDepth / 8, true); // BlockAlign
        view.setUint16(34, bitDepth, true); // BitsPerSample (16)

        // Write data sub-chunk
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataLength, true); // Subchunk2Size

        // Write audio data (convert float32 to int16)
        let offset = 44;
        for (let i = 0; i < audioData.length; i++) {
            const sample = Math.max(-1, Math.min(1, audioData[i]));
            const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset, int16, true);
            offset += 2;
        }

        return new Blob([wavBuffer], { type: 'audio/wav' });
    }

    /**
     * Resample audio to target sample rate
     * @param {AudioBuffer} audioBuffer - Original audio buffer
     * @param {number} targetSampleRate - Target sample rate (e.g., 16000)
     * @returns {Float32Array} Resampled audio data
     */
    resampleAudio(audioBuffer, targetSampleRate) {
        const originalSampleRate = audioBuffer.sampleRate;
        const originalData = audioBuffer.getChannelData(0);

        // If already at target sample rate, return as-is
        if (originalSampleRate === targetSampleRate) {
            return originalData;
        }

        // Calculate new length
        const sampleRateRatio = targetSampleRate / originalSampleRate;
        const newLength = Math.round(originalData.length * sampleRateRatio);
        const resampledData = new Float32Array(newLength);

        // Simple linear interpolation resampling
        for (let i = 0; i < newLength; i++) {
            const position = i / sampleRateRatio;
            const index = Math.floor(position);
            const fraction = position - index;

            if (index + 1 < originalData.length) {
                resampledData[i] = originalData[index] * (1 - fraction) + originalData[index + 1] * fraction;
            } else {
                resampledData[i] = originalData[index];
            }
        }

        return resampledData;
    }

    /**
     * Helper to write string to DataView
     * @param {DataView} view - DataView to write to
     * @param {number} offset - Offset position
     * @param {string} string - String to write
     */
    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    /**
     * Encode audio blob to base64 string
     * @param {Blob} blob - Audio blob to encode
     * @returns {Promise<string>} Base64 encoded audio
     */
    async encodeToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Remove data URL prefix (e.g., "data:audio/wav;base64,")
                const dataUrl = reader.result;
                const base64 = dataUrl.split(',')[1];

                if (!base64) {
                    reject(new Error('Failed to extract base64 from data URL'));
                    return;
                }

                // Remove any whitespace/newlines
                const cleanBase64 = base64.replace(/\s/g, '');

                resolve(cleanBase64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    /**
     * Clean up resources
     */
    cleanup() {
        if (this.recordingTimer) {
            clearInterval(this.recordingTimer);
            this.recordingTimer = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        this.mediaRecorder = null;
        this.audioChunks = [];
    }
}

// Export for use in app.js
window.AudioRecorder = AudioRecorder;
