import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Avatar,
  ListItemAvatar,
  Tabs,
  Tab,
  Badge,
  IconButton,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';

const Chat = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(userId || 'all');
  const [unreadCounts, setUnreadCounts] = useState({});
  const socketRef = useRef();
  const messagesEndRef = useRef();

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');

    socketRef.current.emit('join', {
      username: `User-${Math.random().toString(36).substr(2, 9)}`,
    });

    socketRef.current.on('chat-message', (messageData) => {
      setMessages(prev => [...prev, messageData]);
      // Update unread count if message is not from current chat
      if (messageData.from !== socketRef.current?.id && 
          (activeChat === 'all' || messageData.from !== activeChat)) {
        setUnreadCounts(prev => ({
          ...prev,
          [messageData.from]: (prev[messageData.from] || 0) + 1
        }));
      }
    });

    socketRef.current.on('users-list', (usersList) => {
      setUsers(usersList.filter(user => user.id !== socketRef.current?.id));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Reset unread count when switching chats
    if (activeChat !== 'all') {
      setUnreadCounts(prev => ({ ...prev, [activeChat]: 0 }));
    }
  }, [messages, activeChat]);

  const sendMessage = () => {
    if (message.trim()) {
      socketRef.current.emit('chat-message', {
        to: activeChat,
        message: message.trim(),
      });
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const handleChatChange = (userId) => {
    setActiveChat(userId);
    navigate(`/chat/${userId}`);
  };

  const getUsername = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : 'Unknown User';
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', p: 2, gap: 2 }}>
      {/* User List */}
      <Paper sx={{ width: 250, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Users
        </Typography>
        <List>
          <ListItem
            button
            selected={activeChat === 'all'}
            onClick={() => handleChatChange('all')}
          >
            <ListItemAvatar>
              <Avatar>
                <ChatIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="Group Chat" />
          </ListItem>
          <Divider />
          {users.map((user) => (
            <ListItem
              key={user.id}
              button
              selected={activeChat === user.id}
              onClick={() => handleChatChange(user.id)}
            >
              <ListItemAvatar>
                <Avatar>
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText 
                primary={user.username}
                secondary={unreadCounts[user.id] ? `${unreadCounts[user.id]} unread` : ''}
              />
              {unreadCounts[user.id] > 0 && activeChat !== user.id && (
                <Badge badgeContent={unreadCounts[user.id]} color="primary" />
              )}
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Paper sx={{ flex: 1, mb: 2, p: 2, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            {activeChat === 'all' ? 'Group Chat' : `Chat with ${getUsername(activeChat)}`}
          </Typography>
          <List>
            {messages
              .filter(msg => 
                activeChat === 'all' || 
                msg.from === activeChat || 
                msg.from === socketRef.current?.id
              )
              .map((msg, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        {msg.from === socketRef.current?.id ? <PersonIcon /> : <ChatIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={msg.username}
                      secondary={msg.message}
                      primaryTypographyProps={{
                        color: msg.from === socketRef.current?.id ? 'primary' : 'textPrimary',
                      }}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            <div ref={messagesEndRef} />
          </List>
        </Paper>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={`Type a message to ${activeChat === 'all' ? 'everyone' : getUsername(activeChat)}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={sendMessage}
            endIcon={<SendIcon />}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Chat; 