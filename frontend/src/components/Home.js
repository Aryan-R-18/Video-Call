import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Grid,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import ChatIcon from '@mui/icons-material/Chat';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const Home = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [showCopiedAlert, setShowCopiedAlert] = useState(false);

  const handleJoinCall = () => {
    if (username && roomId) {
      navigate(`/video-call/${roomId}`);
    }
  };

  const handleStartChat = () => {
    if (username) {
      navigate('/chat');
    }
  };

  const copyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setShowCopiedAlert(true);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Video Call & Chat
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Connect with friends and colleagues through video calls and chat
        </Typography>
      </Box>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Start or Join a Video Call
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              To start a call, enter your name and create a room ID. Share the room ID with others to join the same call.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Your Name"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Room ID"
                  variant="outlined"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
                <IconButton
                  onClick={copyRoomId}
                  disabled={!roomId}
                  color="primary"
                  sx={{ mt: 1 }}
                >
                  <ContentCopyIcon />
                </IconButton>
              </Box>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<VideocamIcon />}
                onClick={handleJoinCall}
                disabled={!username || !roomId}
              >
                Join Call
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Start Chatting
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Enter your name to start chatting with other users in the application.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Your Name"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                fullWidth
                variant="contained"
                color="secondary"
                startIcon={<ChatIcon />}
                onClick={handleStartChat}
                disabled={!username}
              >
                Start Chat
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={showCopiedAlert}
        autoHideDuration={3000}
        onClose={() => setShowCopiedAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowCopiedAlert(false)} severity="success">
          Room ID copied to clipboard!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Home; 