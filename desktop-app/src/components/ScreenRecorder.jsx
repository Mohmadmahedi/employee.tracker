import { useEffect, useRef } from 'react';
import api from '../services/api';

const ScreenRecorder = () => {
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    useEffect(() => {
        const handleStartRecording = async ({ duration, employeeId }) => {
            console.log('Starting recording...', { duration, employeeId });
            try {
                const sourceId = await window.trackerAPI.getDesktopSourceId();
                if (!sourceId) {
                    console.error('No screen source found');
                    return;
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: sourceId,
                            maxWidth: 1920,
                            maxHeight: 1080
                        }
                    }
                });

                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'video/webm; codecs=vp9'
                });

                mediaRecorderRef.current = mediaRecorder;
                chunksRef.current = [];

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        chunksRef.current.push(e.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                    const file = new File([blob], 'recording.webm', { type: 'video/webm' });

                    const formData = new FormData();
                    formData.append('recording', file);
                    formData.append('employeeId', employeeId);
                    formData.append('duration', Math.round(duration / 1000));

                    try {
                        console.log('Uploading recording...');
                        await api.post('/recordings/upload', formData, {
                            headers: {
                                'Content-Type': 'multipart/form-data'
                            }
                        });
                        console.log('Recording uploaded successfully');
                    } catch (error) {
                        console.error('Failed to upload recording:', error);
                    }

                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();

                // Stop after duration
                setTimeout(() => {
                    if (mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                }, duration);

            } catch (error) {
                console.error('Failed to start recording:', error);
            }
        };

        const cleanup = () => {
            // Cleanup if component unmounts mid-recording
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };

        // Register listener
        // Note: multiple listeners might duplicate if not handled, but useEffect [] handles mount/unmount
        if (window.trackerAPI) {
            window.trackerAPI.onStartRecording(handleStartRecording);
        }

        return cleanup;
    }, []);

    return null; // Invisible component
};

export default ScreenRecorder;
