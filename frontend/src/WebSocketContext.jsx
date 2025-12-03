import React, { createContext, useContext, useEffect, useState } from 'react';

// Create WebSocket context
const WebSocketContext = createContext(null);

// Custom hook to use WebSocket context
export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newEmails, setNewEmails] = useState([]);
  const [newEvents, setNewEvents] = useState([]);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Function to establish WebSocket connection
  const connectWebSocket = () => {
    // For Vite development with proxy
    const wsUrl = '/ws';
    
    // For direct connection (uncomment if proxy doesn't work)
    // const wsUrl = 'ws://127.0.0.1:8000/ws';
    
    console.log('Connecting to WebSocket at:', wsUrl);
    setConnectionAttempts(prev => prev + 1);
    
    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connection established');
        setConnected(true);
        setConnectionAttempts(0); // Reset counter on successful connection
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
        setConnected(false);
        
        // Implement exponential backoff for reconnection
        const delay = Math.min(3000 * Math.pow(1.5, connectionAttempts), 30000);
        console.log(`Attempting to reconnect in ${delay/1000} seconds... (Attempt ${connectionAttempts + 1})`);
        
        // Try to reconnect after a delay
        setTimeout(connectWebSocket, delay);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Don't close here, let the onclose handler manage reconnection
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          
          // Store message in history
          setMessages(prev => [...prev, data]);
          
          // Handle different message types
          if (data.type === 'new_emails') {
            handleNewEmails(data.data);
          } else if (data.type === 'new_events') {
            handleNewEvents(data.data);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      setSocket(ws);
      return ws;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      // Try to reconnect after a delay
      setTimeout(connectWebSocket, 3000);
      return null;
    }
  };

  // Handle new emails from WebSocket
  const handleNewEmails = (emails) => {
    console.log('Received new emails:', emails);
    setNewEmails(emails);
    
    // You can also trigger notifications here
    if (emails && emails.length > 0) {
      // Find high priority emails
      const highPriorityEmails = emails.filter(email => email.importance >= 2);
      
      if (highPriorityEmails.length > 0) {
        // Trigger browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification('New Important Emails', {
            body: `You have ${highPriorityEmails.length} new important emails`,
            icon: '/notification-icon.png'
          });
        }
      }
    }
  };

  // Handle new events from WebSocket
  const handleNewEvents = (eventData) => {
    console.log('Received new events:', eventData);
    setNewEvents(eventData);
    
    // Handle today's events specially
    if (eventData.today_events && eventData.today_events.length > 0) {
      // Trigger notification for today's events
      if (Notification.permission === 'granted') {
        new Notification('Events Today', {
          body: `You have ${eventData.today_events.length} events scheduled for today`,
          icon: '/calendar-icon.png'
        });
      }
    }
  };

  // Send message through WebSocket
  const sendMessage = (message) => {
    if (socket && connected) {
      socket.send(JSON.stringify(message));
    } else {
      console.error('Cannot send message: WebSocket not connected');
    }
  };

  // Ping to keep the connection alive
  const pingServer = () => {
    if (socket && connected) {
      sendMessage({ type: 'ping' });
    }
  };

  // Connect WebSocket on component mount
  useEffect(() => {
    // Request notification permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    
    const ws = connectWebSocket();
    
    // Set up ping interval to keep connection alive
    const pingInterval = setInterval(pingServer, 30000); // 30 seconds
    
    // Clean up on unmount
    return () => {
      clearInterval(pingInterval);
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Context value to expose to components
  const value = {
    connected,
    messages,
    newEmails,
    newEvents,
    sendMessage,
    reconnect: connectWebSocket,
    connectionAttempts
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext; 