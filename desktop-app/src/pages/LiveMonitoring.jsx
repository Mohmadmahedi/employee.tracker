import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Monitor,
  FiberManualRecord,
  Visibility,
  Refresh,
  Stop,
  CameraAlt
} from '@mui/icons-material';
import socketService from '../services/socketService';
import employeeService from '../services/employeeService';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { toast } from 'react-toastify';

function LiveMonitoring() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingStream, setViewingStream] = useState(null); // employeeId
  const [isRecording, setIsRecording] = useState(false);
  const [streamReady, setStreamReady] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(null);

  const videoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const canvasRef = useRef(null); // Used if we need to take screenshots of the video

  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchEmployees();

    const token = localStorage.getItem('token');
    socketService.connect(token);
    socketService.joinAdminRoom(user?.id);

    // Activity updates
    socketService.on('employee:activity', (data) => {
      console.log('[LiveMonitoring] ⚡ Activity Update Received:', data);
      setEmployees(prev => prev.map(emp =>
        emp.id === data.employeeId
          ? { ...emp, current_status: data.status, last_seen: data.timestamp }
          : emp
      ));
    });

    // WebRTC Signaling Handlers
    console.log('[LiveMonitoring] Registering webrtc:offer listener');
    socketService.on('webrtc:offer', async (data) => {
      console.log('[LiveMonitoring] ✅ Received WebRTC Offer!', data);
      await handleWebRTCOffer(data);
    });

    // Handle video readiness signal
    socketService.on('employee:video-ready', (data) => {
      console.log('[LiveMonitoring] 📹 Employee Video Ready:', data);
      setEmployees(prev => prev.map(emp =>
        emp.id === data.employeeId
          ? { ...emp, is_video_ready: true } // explicit true
          : emp
      ));
    });

    // Handle employee disconnection (clear video readiness)
    socketService.on('employee:disconnected', (data) => {
      console.log('[LiveMonitoring] ❌ Employee Disconnected:', data);
      setEmployees(prev => prev.map(emp =>
        emp.id === data.employeeId
          ? { ...emp, is_video_ready: false, current_status: 'OFF' }
          : emp
      ));
    });

    // Handle Initial Video State Sync
    socketService.on('admin:initial-video-state', (employeeIds) => {
      console.log('[LiveMonitoring] 🔄 Initial Video State Sync:', employeeIds);
      setEmployees(prev => prev.map(emp =>
        employeeIds.includes(emp.id)
          ? { ...emp, is_video_ready: true }
          : emp
      ));
    });

    // Debug: Listen to ALL socket events
    if (socketService.socket) {
      socketService.socket.onAny((event, ...args) => {
        console.log('[LiveMonitoring] Socket event received:', event);
      });
    }

    // Handle stream errors (e.g. offline, timeout)
    socketService.on('admin:stream-error', (data) => {
      console.warn('[LiveMonitoring] Stream Error:', data);
      toast.warning(data.message || 'Unable to connect to employee.');
      // If we were waiting, maybe close the dialog or show retry button
      // For now, keep dialog open but show warning
    });

    socketService.on('webrtc:ice-candidate', async (data) => {
      if (peerConnectionRef.current) {
        try {
          console.log('[LiveMonitoring] ❄️ Received ICE candidate from Employee');
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) { console.error('[LiveMonitoring] ❌ Error adding ICE candidate:', e); }
      }
    });

    return () => {
      socketService.off('employee:activity');
      socketService.off('employee:video-ready');
      socketService.off('webrtc:offer');
      socketService.off('webrtc:ice-candidate');
    };
  }, []);

  const handleWebRTCOffer = async (data) => {
    try {
      console.log('[LiveMonitoring] 📥 Received WebRTC Offer from:', data.senderSocketId);

      // Cleanup any existing connection
      if (peerConnectionRef.current) {
        console.log('[LiveMonitoring] Closing existing peer connection before accepting new offer');
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      setStreamReady(false); // Reset ready state

      console.log('[LiveMonitoring] Fetching secure TURN credentials...');
      let iceServers = [{ urls: 'stun:stun.l.google.com:19302' }]; // Default fallback

      try {
        const response = await api.get('/turn');
        if (response.data && response.data.iceServers) {
          iceServers = response.data.iceServers;
        }
      } catch (e) {
        console.warn('[LiveMonitoring] Failed to fetch TURN credentials, using STUN fallback:', e);
      }

      console.log('[LiveMonitoring] Creating new RTCPeerConnection...');
      const pc = new RTCPeerConnection({
        iceServers: iceServers,
        iceTransportPolicy: 'all', // Allow both STUN and TURN
        iceCandidatePoolSize: 10
      });

      peerConnectionRef.current = pc;

      // Connection state logging
      pc.onconnectionstatechange = () => {
        console.log(`[LiveMonitoring] 🚥 Connection state: ${pc.connectionState}`);
        if (pc.connectionState === 'connected') {
          setStreamReady(true);
          toast.success('Live stream connected!');
        } else if (pc.connectionState === 'failed') {
          console.warn('[LiveMonitoring] ❌ Connection failed');
          // Don't auto-close dialog, let user decide or retry
          setStreamReady(false);
          toast.error('Connection failed');
        } else if (pc.connectionState === 'disconnected') {
          console.warn('[LiveMonitoring] ⚠️ Connection disconnected (waiting for recovery...)');
          // Do NOT setStreamReady(false) immediately, give it a chance to recover
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[LiveMonitoring] 🧊 ICE Connection state: ${pc.iceConnectionState}`);
      };

      pc.onicecandidateerror = (event) => {
        console.warn('[LiveMonitoring] 🧊 ICE Candidate Error:', event.errorText, event.errorCode, event.url);
      };

      // Handle Track - This is crucial!
      pc.ontrack = (event) => {
        console.log('[LiveMonitoring] 📺 Received Remote Track', event.streams);
        if (event.streams && event.streams[0]) {
          if (videoRef.current) {
            // Fix: Check if we are already playing this stream to avoid "play() interrupted" error
            if (videoRef.current.srcObject !== event.streams[0]) {
              videoRef.current.srcObject = event.streams[0];
              console.log('[LiveMonitoring] ✅ Assigned stream to video element');

              // Force play
              videoRef.current.play().catch(e => console.error('[LiveMonitoring] Auto-play failed:', e));
            } else {
              console.log('[LiveMonitoring] ℹ️ Stream already assigned, skipping play() call');
            }
          }
        }
      };

      // Handle ICE
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // console.log('[LiveMonitoring] ❄️ Found local ICE candidate');
          socketService.emit('webrtc:ice-candidate', {
            targetSocketId: data.senderSocketId,
            candidate: event.candidate
          });
        }
      };

      // Set Remote Description (Offer)
      console.log('[LiveMonitoring] Setting remote description...');
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

      // Create Answer
      console.log('[LiveMonitoring] 📝 Creating WebRTC answer...');
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send Answer
      console.log('[LiveMonitoring] 📤 Sending answer back to:', data.senderSocketId);
      socketService.emit('webrtc:answer', {
        targetSocketId: data.senderSocketId,
        sdp: answer
      });
      console.log('[LiveMonitoring] ✅ Answer emission call completed');

    } catch (err) {
      console.error('[LiveMonitoring] ❌ WebRTC negotiation failed:', err);
      toast.error('Failed to establish connection: ' + err.message);
      setStreamReady(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getEmployees();
      console.log('[LiveMonitoring] 📋 Fetched employees:', response.data);
      console.log('[LiveMonitoring] First employee ID:', response.data?.[0]?.id);
      setEmployees(response.data);
    } catch (error) {
      console.error('[LiveMonitoring] ❌ Failed to fetch employees:', error);
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const startLiveStream = (employeeId) => {
    console.log('[LiveMonitoring] 🎯 startLiveStream called with employeeId:', employeeId);
    console.log('[LiveMonitoring] Current user (admin):', user);

    // Reset state
    setStreamReady(false);
    setViewingStream(employeeId);

    // Request stream
    socketService.requestLiveScreen(employeeId, user?.id);
    toast.info('Requesting live stream...');
  };

  const stopLiveStream = () => {
    if (isRecording) stopRecording();

    // Send stop signal
    if (viewingStream) {
      socketService.emit('admin:stop-live-screen', { employeeId: viewingStream });
    }

    // Cleanup local PC
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setViewingStream(null);
    setStreamReady(false);
  };

  // ... (Keep handleTakeScreenshot)

  // ... (Keep startRecording/stopRecording but adapted for Video element if needed)
  // Note: MediaRecorder in browser can record from a stream directly.
  const startRecording = () => {
    if (!videoRef.current || !videoRef.current.srcObject) {
      toast.error('No video stream to record');
      return;
    }

    recordedChunksRef.current = [];
    // Record the stream directly from the video element's source
    const stream = videoRef.current.srcObject;

    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8'
    });

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    const startTime = Date.now();
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const duration = Math.round((Date.now() - startTime) / 1000);
      const currentEmployeeId = viewingStream;

      const formData = new FormData();
      formData.append('employeeId', currentEmployeeId);
      formData.append('duration', duration);
      formData.append('recording', blob, `recording_${currentEmployeeId}.webm`);

      try {
        toast.info('Uploading recording...');
        await api.post('/recordings/upload', formData);
        toast.success('Recording saved successfully');
      } catch (error) {
        console.error(error);
        toast.error('Failed to upload recording');
      }
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
    setRecordingStartTime(Date.now());
    toast.success('Recording started');
  };

  // ... (Keep stopRecording same)
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingStartTime(null);
    }
  };

  const handleTakeScreenshot = (employeeId) => {
    // If we have a live video, we can grab a frame from it locally!
    if (viewingStream === employeeId && videoRef.current && streamReady) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);

      // Download or Upload? 
      // Original logic requested screenshot from employee. 
      // Local screenshot is faster if stream is quality.
      // Let's stick to requesting from employee for full resolution consistency
      socketService.emit('admin:request-screenshot', { employeeId, adminId: user?.id });
      toast.info('Screenshot requested');
    } else {
      socketService.emit('admin:request-screenshot', { employeeId, adminId: user?.id });
      toast.info('Screenshot requested');
    }
  };

  // ... (Keep getStatusColor)
  const getStatusColor = (status, lastSeen) => {
    if (!lastSeen) return 'info';
    const lastSeenDate = new Date(lastSeen);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    if (lastSeenDate < tenMinutesAgo || status === 'OFF') return 'error';
    if (status === 'WORKING') return 'success';
    if (status === 'BREAK') return 'warning';
    return 'primary';
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">Live Screen Monitoring</Typography>
        <Button startIcon={<Refresh />} onClick={fetchEmployees} variant="outlined">Refresh List</Button>
      </Box>

      <Grid container spacing={3}>
        {employees.map((emp) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={emp.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {emp.full_name?.charAt(0) || '?'}
                  </Avatar>
                }
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ maxWidth: 120 }}>
                      {emp.full_name}
                    </Typography>
                    <Chip
                      size="small"
                      icon={<FiberManualRecord sx={{ fontSize: '10px !important' }} />}
                      label={emp.current_status === 'OFF' ? 'Offline' : (emp.current_status || 'Offline')}
                      color={getStatusColor(emp.current_status, emp.last_seen)}
                      sx={{
                        height: 22,
                        fontSize: '0.7rem',
                        '& .MuiChip-icon': {
                          color: 'inherit',
                          ml: 0.5
                        }
                      }}
                    />
                  </Box>
                }
                subheader={emp.pc_name || 'Generic PC'}
                sx={{ pb: 1 }}
              />
              <CardContent sx={{ flexGrow: 1, p: 0, position: 'relative', bgcolor: '#000', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Monitor sx={{ fontSize: 48, color: 'rgba(255,255,255,0.5)' }} />
                {/* No live preview in the grid to save bandwidth, only on specific click */}
                <Box sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 1,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Visibility />}
                    onClick={() => startLiveStream(emp.id)}
                    sx={{ borderRadius: 10 }}
                  >
                    View Live
                  </Button>
                  {emp.is_video_ready && (
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        bgcolor: '#4caf50',
                        borderRadius: '50%',
                        ml: 1,
                        boxShadow: '0 0 5px #4caf50',
                        title: "Video Socket Ready"
                      }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Live Stream Dialog */}
      <Dialog
        open={!!viewingStream}
        onClose={stopLiveStream}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Monitor sx={{ mr: 1 }} />
            Live Stream: {employees.find(e => e.id === viewingStream)?.full_name}
          </Box>
          <IconButton onClick={stopLiveStream}>
            <Stop color="error" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, bgcolor: '#1a1a1a', minHeight: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {/* Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted // Muted to prevent feedback if audio were enabled
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              display: streamReady ? 'block' : 'none'
            }}
          />
          {!streamReady && (
            <Box sx={{ textAlign: 'center', color: 'white' }}>
              <CircularProgress color="inherit" sx={{ mb: 2 }} />
              <Typography>Connecting to employee screen...</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {isRecording ? (
            <Button
              variant="contained"
              color="error"
              startIcon={<Stop />}
              onClick={stopRecording}
              sx={{ borderRadius: 10 }}
            >
              Stop Recording
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<CameraAlt />}
                onClick={() => handleTakeScreenshot(viewingStream)}
                sx={{ borderRadius: 10, mr: 2 }}
              >
                Take Screenshot
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<FiberManualRecord />}
                onClick={startRecording}
                disabled={!streamReady}
                sx={{ borderRadius: 10 }}
              >
                Start Recording
              </Button>
            </>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={stopLiveStream} variant="outlined">Close Window</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default LiveMonitoring;
