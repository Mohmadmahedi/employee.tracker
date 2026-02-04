import { useEffect, useRef, useState } from 'react';
import socketService from '../services/socketService';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const ScreenBroadcaster = () => {
    const peerConnection = useRef(null);
    const isStarting = useRef(false);
    const localStream = useRef(null);
    const currentAdminSocketId = useRef(null);
    const [isStreaming, setIsStreaming] = useState(false);

    const { user } = useAuthStore();
    const isElectron = !!window.trackerAPI;

    useEffect(() => {
        // This component works in both Electron and Browser mode
        console.log('[ScreenBroadcaster] Initializing...', { isElectron, userId: user?.id });

        const handleStartStream = async (data) => {
            if (isStarting.current) {
                console.log('[ScreenBroadcaster] Already starting a stream, ignoring request');
                return;
            }

            console.log('[ScreenBroadcaster] 🎬 Starting WebRTC stream request...', data);
            isStarting.current = true;

            const targetSocketId = data.adminSocketId || data.sessionId;

            if (!targetSocketId) {
                console.error('[ScreenBroadcaster] ❌ No target socket ID in data!', data);
                isStarting.current = false;
                return;
            }

            cleanup();

            console.log('[ScreenBroadcaster] Target Socket ID:', targetSocketId);
            currentAdminSocketId.current = targetSocketId;

            try {
                let stream;

                if (isElectron) {
                    // Electron mode: Use Electron's desktopCapturer
                    const sourceId = await window.trackerAPI.getDesktopSourceId();
                    if (!sourceId) {
                        console.error('No screen source found');
                        socketService.emit('employee:stream-failed', {
                            targetSocketId,
                            error: 'No screen source available (Permissions?)'
                        });
                        isStarting.current = false;
                        return;
                    }

                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: sourceId,
                                maxWidth: 1920,
                                maxHeight: 1080,
                                minWidth: 1280,
                                minHeight: 720,
                                minFrameRate: 30
                            }
                        }
                    });
                } else {
                    // Browser mode: Use getDisplayMedia for screen sharing
                    console.log('[ScreenBroadcaster] Browser mode - requesting screen share...');
                    try {
                        stream = await navigator.mediaDevices.getDisplayMedia({
                            video: {
                                cursor: 'always',
                                displaySurface: 'monitor',
                                width: { ideal: 1920 },
                                height: { ideal: 1080 },
                                frameRate: { ideal: 30 }
                            },
                            audio: false
                        });
                        console.log('[ScreenBroadcaster] ✅ Screen share permission granted');
                    } catch (permError) {
                        console.error('[ScreenBroadcaster] ❌ Screen share denied:', permError);
                        socketService.emit('employee:stream-failed', {
                            targetSocketId,
                            error: 'Screen share permission denied'
                        });
                        isStarting.current = false;
                        return;
                    }
                }

                localStream.current = stream;
                setIsStreaming(true);

                // Handle stream end (user clicks "Stop sharing")
                stream.getVideoTracks()[0].onended = () => {
                    console.log('[ScreenBroadcaster] Screen share stopped by user');
                    cleanup();
                    setIsStreaming(false);
                };

                // Create Peer Connection
                await createPeerConnection(targetSocketId, stream);
                isStarting.current = false;

            } catch (error) {
                console.error('Failed to start WebRTC stream:', error);
                socketService.emit('employee:stream-failed', {
                    targetSocketId,
                    error: error.message || 'Unknown WebRTC error'
                });
                isStarting.current = false;
            }
        };

        const handleStopStream = () => {
            console.log('Stopping WebRTC stream');
            cleanup();
            setIsStreaming(false);
        };

        // Listen for stream requests via socket (works in both modes)
        const employeeId = user?.id;
        if (employeeId) {
            console.log(`[ScreenBroadcaster] Listening for start-stream on employee:${employeeId}:start-stream`);

            socketService.on(`employee:${employeeId}:start-stream`, handleStartStream);
            socketService.on(`employee:${employeeId}:stop-stream`, handleStopStream);
        }

        // Also listen via IPC for Electron mode
        if (isElectron) {
            window.trackerAPI.onStartWebRTCStream(handleStartStream);
            window.trackerAPI.onStopWebRTCStream(handleStopStream);
        }

        // Reconnection logic for socket
        const handleSocketConnect = () => {
            console.log('[ScreenBroadcaster] 🔌 Socket connected/reconnected. Sending readiness signal...');
            setTimeout(() => {
                socketService.emit('employee:live-ready', {});
            }, 1000);
        };

        socketService.on('connect', handleSocketConnect);
        socketService.on('webrtc:answer', handleAnswer);
        socketService.on('webrtc:ice-candidate', handleNewICECandidate);

        // Emit readiness signal on mount
        const readyTimer = setTimeout(() => {
            console.log('[ScreenBroadcaster] ✅ Emitting readiness signal to server');
            socketService.emit('employee:live-ready', {});
        }, 1500);

        return () => {
            clearTimeout(readyTimer);
            cleanup();
            if (employeeId) {
                socketService.off(`employee:${employeeId}:start-stream`, handleStartStream);
                socketService.off(`employee:${employeeId}:stop-stream`, handleStopStream);
            }
            socketService.off('webrtc:answer', handleAnswer);
            socketService.off('webrtc:ice-candidate', handleNewICECandidate);
            socketService.off('connect', handleSocketConnect);
        };
    }, [user?.id]);

    const createPeerConnection = async (targetSocketId, stream) => {
        if (peerConnection.current) {
            console.log('[ScreenBroadcaster] Closing existing peer connection');
            peerConnection.current.close();
        }

        try {
            console.log('[ScreenBroadcaster] Fetching secure TURN credentials...');
            const response = await api.get('/turn');
            const { iceServers } = response.data;

            console.log('[ScreenBroadcaster] Creating RTCPeerConnection...');
            const pc = new RTCPeerConnection({
                iceServers: iceServers,
                iceTransportPolicy: 'all', // Allow both STUN and TURN for maximum compatibility
                iceCandidatePoolSize: 10
            });

            peerConnection.current = pc;

            pc.onconnectionstatechange = () => {
                const state = pc.connectionState;
                console.log(`[ScreenBroadcaster] 🚥 Connection state: ${state}`);

                if (state === 'failed' || state === 'disconnected') {
                    console.warn(`[ScreenBroadcaster] ❌ Connection ${state}. Auto-restarting stream...`);
                    if (peerConnection.current) {
                        peerConnection.current.close();
                        peerConnection.current = null;
                    }
                    console.log('[ScreenBroadcaster] 🔄 Re-announcing readiness...');
                    socketService.emit('employee:live-ready', {});
                }
            };

            pc.oniceconnectionstatechange = () => {
                console.log(`[ScreenBroadcaster] 🧊 ICE Connection state: ${pc.iceConnectionState}`);
            };

            pc.onsignalingstatechange = () => {
                console.log(`[ScreenBroadcaster] 📡 Signaling state: ${pc.signalingState}`);
            };

            pc.onicecandidateerror = (event) => {
                console.warn('[ScreenBroadcaster] 🧊 ICE Candidate Error:', event.errorText, event.errorCode, event.url);
            };

            // Add Tracks
            console.log('[ScreenBroadcaster] Adding tracks to peer connection');
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // ICE Candidates
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('[ScreenBroadcaster] ❄️ Found local ICE candidate');
                    socketService.emit('webrtc:ice-candidate', {
                        targetSocketId,
                        candidate: event.candidate
                    });
                } else {
                    console.log('[ScreenBroadcaster] ❄️ End of ICE candidates');
                }
            };

            // Create Offer
            console.log('[ScreenBroadcaster] 📝 Creating WebRTC offer...');
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            console.log('[ScreenBroadcaster] 📤 Offer created, sending to:', targetSocketId);
            socketService.emit('webrtc:offer', {
                targetSocketId,
                sdp: offer
            });
            console.log('[ScreenBroadcaster] ✅ Offer emission call completed');

        } catch (fetchError) {
            console.error('[ScreenBroadcaster] ❌ Failed to initialize secure peer connection:', fetchError);
        }
    };

    const handleAnswer = async (data) => {
        if (!peerConnection.current) return;
        try {
            console.log('[ScreenBroadcaster] 📥 Received WebRTC Answer from Admin');
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
            console.log('[ScreenBroadcaster] ✅ Remote description (Answer) set successfully');
        } catch (e) {
            console.error('[ScreenBroadcaster] ❌ Error setting remote description:', e);
        }
    };

    const handleNewICECandidate = async (data) => {
        if (!peerConnection.current) return;
        try {
            console.log('[ScreenBroadcaster] ❄️ Received ICE candidate from Admin');
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
            console.error('[ScreenBroadcaster] ❌ Error adding ICE candidate:', e);
        }
    };

    const cleanup = () => {
        if (localStream.current) {
            localStream.current.getTracks().forEach(track => track.stop());
            localStream.current = null;
        }
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        isStarting.current = false;
    };

    // Invisible component - no UI render
    return null;
};

export default ScreenBroadcaster;
