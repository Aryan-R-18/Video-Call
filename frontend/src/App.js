import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Home from './components/Home';
import VideoCall from './components/VideoCall';
import Chat from './components/Chat';
import Navbar from './components/Navbar';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/video-call/:roomId" element={<VideoCall />} />
          <Route path="/chat" element={<Navigate to="/chat/all" replace />} />
          <Route path="/chat/:userId" element={<Chat />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 