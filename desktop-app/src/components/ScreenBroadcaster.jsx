import { useEffect, useRef } from 'react';
import socketService from '../services/socketService';
import api from '../services/api';

const ScreenBroadcaster = () => {
    const peerConnection = useRef(null);
    const isStarting = useRef(false);
    const localStream = useRef(null);
    const currentAdminSocketId = useRef(null);

    useEffect(() => {
        // Only run this effect once on mount
        if (!window.trackerAPI) return;

        const handleStartStream = async (data) => {
            if (isStarting.current) {
                console.log('[ScreenBroadcaster] Already starting a stream, ignoring request');
                return;
            }

            console.log('[ScreenBroadcaster] 🎬 Starting WebRTC stream request...', data);
            isStarting.current = true;

            // Accept either adminSocketId or sessionId (for compatibility)
            const targetSocketId = data.adminSocketId || data.sessionId;

            if (!targetSocketId) {
                console.error('[ScreenBroadcaster] ❌ No target socket ID in data!', data);
                isStarting.current = false;
                return;
            }

            // Cleanup previous session if any
            cleanup();

            console.log('[ScreenBroadcaster] Target Socket ID:', targetSocketId);
            currentAdminSocketId.current = targetSocketId;

            try {
                // 1. Get Screen Source ID
                const sourceId = await window.trackerAPI.getDesktopSourceId();
                if (!sourceId) {
                    console.error('No screen source found');
                    isStarting.current = false;
                    return;
                }

                // 2. Get User Media
                console.log('Attempting to get media with sourceId:', sourceId);
                let stream;
                try {
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
                } catch (mediaError) {
                    console.error('getUserMedia failed:', mediaError);
                    isStarting.current = false;
                    return;
                }

                localStream.current = stream;

                // 3. Create Peer Connection
                await createPeerConnection(targetSocketId, stream);
                isStarting.current = false;

            } catch (error) {
                console.error('Failed to start WebRTC stream:', error);
                isStarting.current = false;
            }
        };

        const handleStopStream = () => {
            console.log('Stopping WebRTC stream');
            cleanup();
        };

        // Listen for IPC events
        window.trackerAPI.onStartWebRTCStream(handleStartStream);
        window.trackerAPI.onStopWebRTCStream(handleStopStream);

        // Listen for WebRTC Signaling from Admin (Answer, Candidates)
        // Note: socketService listeners should be cleaned up too
        socketService.on('webrtc:answer', handleAnswer);
        socketService.on('webrtc:ice-candidate', handleNewICECandidate);

        // Tell the server we are ready for live monitoring
        // We use a timeout to ensure the socket connection is fully established
        const readyTimer = setTimeout(() => {
            console.log('[ScreenBroadcaster] ✅ Emitting readiness signal to server');
            socketService.emit('employee:live-ready', {});
        }, 1500);

        return () => {
            clearTimeout(readyTimer);
            cleanup();
            socketService.off('webrtc:answer', handleAnswer);
            socketService.off('webrtc:ice-candidate', handleNewICECandidate);
        };
    }, []);

    const createPeerConnection = async (targetSocketId, stream) => {
        if (peerConnection.current) {
            console.log('[ScreenBroadcaster] Closing existing peer connection');
            peerConnection.current.close();
        }

        try {
            console.log('[ScreenBroadcaster] Fetching secure TURN credentials...');
            const response = await api.get('/turn');
            const { iceServers } = response.data;

            console.log('[ScreenBroadcaster] Creating new Secure RTCPeerConnection...');
            const pc = new RTCPeerConnection({
                iceServers: iceServers,
                iceTransportPolicy: 'relay', // Fix: Mandatory for enterprise security
                iceCandidatePoolSize: 10
            });

            peerConnection.current = pc;

            // Track connection state changes
            pc.onconnectionstatechange = () => {
                console.log(`[ScreenBroadcaster] 🚥 Connection state: ${pc.connectionState}`);
                if (pc.connectionState === 'failed') {
                    console.warn('[ScreenBroadcaster] ❌ Connection FAILED. This usually means a firewall is blocking WebRTC (UDP).');
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
            try {
                console.log('[ScreenBroadcaster] 📝 Creating WebRTC offer...');
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                console.log('[ScreenBroadcaster] 📤 Offer created, sending to:', targetSocketId);
                socketService.emit('webrtc:offer', {
                    targetSocketId,
                    sdp: offer
                });
                console.log('[ScreenBroadcaster] ✅ Offer emission call completed');
            } catch (offerError) {
                console.error('[ScreenBroadcaster] ❌ Failed to create/send offer:', offerError);
            }
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
    };

    return null; // Invisible component
};

export default ScreenBroadcaster;
