import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Divider,
} from '@mui/material';
import {
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  CallEnd,
  Person,
} from '@mui/icons-material';

const VideoCall = () => {
  const { roomId } = useParams();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const localVideoRef = useRef();
  const socketRef = useRef();
  const peerConnections = useRef(new Map());

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        setIsLoading(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // Initialize socket connection
        socketRef.current = io('https://video-call-6r64.onrender.com'); // Deployed server

        const username = `User-${Math.random().toString(36).substr(2, 9)}`;
        socketRef.current.emit('join', {
          username,
          roomId,
        });

        // Handle incoming calls
        socketRef.current.on('offer', async ({ from, offer }) => {
          if (localStream) {
            const peerConnection = await createPeerConnection(from);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socketRef.current.emit('answer', { to: from, answer });
          }
        });

        socketRef.current.on('answer', async ({ from, answer }) => {
          const peerConnection = peerConnections.current.get(from);
          if (peerConnection) {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          }
        });

        socketRef.current.on('ice-candidate', async ({ from, candidate }) => {
          const peerConnection = peerConnections.current.get(from);
          if (peerConnection) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          }
        });

        socketRef.current.on('user-joined', async ({ user }) => {
          if (localStream) {
            await createPeerConnection(user.id);
          }
          setParticipants((prev) => [...prev, user]);
        });

        socketRef.current.on('user-left', ({ userId }) => {
          const peerConnection = peerConnections.current.get(userId);
          if (peerConnection) {
            peerConnection.close();
            peerConnections.current.delete(userId);
            setRemoteStreams((prev) => {
              const newStreams = new Map(prev);
              newStreams.delete(userId);
              return newStreams;
            });
          }
          setParticipants((prev) => prev.filter((p) => p.id !== userId));
        });

        socketRef.current.on('users-list', (usersList) => {
          setParticipants(usersList.filter((user) => user.id !== socketRef.current?.id));
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setIsLoading(false);
      }
    };

    initializeMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      peerConnections.current.forEach((pc) => pc.close());
    };
  }, [roomId]);

  const createPeerConnection = async (userId) => {
    if (!localStream) {
      console.error('Local stream not initialized');
      return null;
    }

    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });

    // Add local stream to peer connection
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      setRemoteStreams((prev) => {
        const newStreams = new Map(prev);
        newStreams.set(userId, event.streams[0]);
        return newStreams;
      });
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', {
          to: userId,
          candidate: event.candidate,
        });
      }
    };

    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socketRef.current.emit('offer', { to: userId, offer });

    peerConnections.current.set(userId, peerConnection);
    return peerConnection;
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    peerConnections.current.forEach((pc) => pc.close());
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, display: 'flex', gap: 2 }}>
      {/* Video Grid */}
      <Box sx={{ flex: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '400px', position: 'relative' }}>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <Typography
                variant="subtitle2"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: 1,
                }}
              >
                You {isMuted && '(Muted)'} {isVideoOff && '(Camera Off)'}
              </Typography>
            </Paper>
          </Grid>
          {Array.from(remoteStreams.entries()).map(([userId, stream]) => {
            const participant = participants.find((p) => p.id === userId);
            return (
              <Grid item xs={12} md={6} key={userId}>
                <Paper sx={{ p: 2, height: '400px', position: 'relative' }}>
                  <video
                    srcObject={stream}
                    autoPlay
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: 1,
                    }}
                  >
                    {participant?.username || 'User'} {userId}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 2 }}>
          <IconButton
            color={isMuted ? 'error' : 'primary'}
            onClick={toggleMute}
            size="large"
          >
            {isMuted ? <MicOff /> : <Mic />}
          </IconButton>
          <IconButton
            color={isVideoOff ? 'error' : 'primary'}
            onClick={toggleVideo}
            size="large"
          >
            {isVideoOff ? <VideocamOff /> : <Videocam />}
          </IconButton>
          <IconButton color="error" onClick={endCall} size="large">
            <CallEnd />
          </IconButton>
        </Box>
      </Box>

      {/* Participants List */}
      <Paper sx={{ width: 250, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Participants ({participants.length + 1})
        </Typography>
        <List>
          <ListItem>
            <ListItemAvatar>
              <Badge
                color={isVideoOff ? 'error' : 'success'}
                variant="dot"
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
              >
                <Avatar>
                  <Person />
                </Avatar>
              </Badge>
            </ListItemAvatar>
            <ListItemText
              primary="You"
              secondary={isMuted ? 'Muted' : 'Speaking'}
            />
          </ListItem>
          <Divider />
          {participants.map((participant) => (
            <ListItem key={participant.id}>
              <ListItemAvatar>
                <Badge
                  color={remoteStreams.has(participant.id) ? 'success' : 'error'}
                  variant="dot"
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                >
                  <Avatar>
                    <Person />
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                          primary={participant.username}
                          secondary={remoteStreams.has(participant.id) ? 'Speaking' : 'No Video'}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
      ); };        

export default VideoCall;