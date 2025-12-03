import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import EmailCard from '../components/EmailCard';
import ReminderList from '../components/ReminderList';
import { useWebSocket } from '../WebSocketContext';
import { parseISO } from 'date-fns';

// Mock data for development
const mockEmails = [
  {
    id: '1',
    sender: 'Project Manager',
    subject: 'Urgent: Project Deadline Update',
    summary: 'The project deadline has been moved up to next Friday. Please prepare all deliverables by Thursday EOD for final review.',
    received: new Date(2023, 3, 15, 9, 30),
    priority: 'high',
    hasEvent: true,
    eventDate: new Date(2023, 3, 21),
    isRead: false,
    category: 'work'
  },
  {
    id: '2',
    sender: 'HR Department',
    subject: 'Company-wide Meeting Tomorrow',
    summary: 'Reminder about the company-wide meeting tomorrow at 10 AM in the main conference room. Attendance is mandatory.',
    received: new Date(2023, 3, 14, 16, 45),
    priority: 'medium',
    hasEvent: true,
    eventDate: new Date(2023, 3, 15, 10, 0),
    isRead: true,
    category: 'work'
  },
  {
    id: '3',
    sender: 'Amazon',
    subject: 'Your Order Has Shipped',
    summary: 'Your recent order #12345 has shipped and is expected to arrive on Wednesday. Track your package with the provided link.',
    received: new Date(2023, 3, 13, 11, 20),
    priority: 'low',
    hasEvent: false,
    isRead: false,
    category: 'shopping'
  },
  {
    id: '4',
    sender: 'Team Lead',
    subject: 'Weekly Sprint Planning',
    summary: 'Our weekly sprint planning meeting is scheduled for Monday at 9 AM. Please prepare your updates and be ready to discuss your tasks for the upcoming sprint.',
    received: new Date(2023, 3, 12, 17, 0),
    priority: 'medium',
    hasEvent: true,
    eventDate: new Date(2023, 3, 17, 9, 0),
    isRead: true,
    category: 'work'
  },
  {
    id: '5',
    sender: 'LinkedIn',
    subject: 'New job opportunities matching your profile',
    summary: 'We found 5 new job opportunities that match your profile. Senior Developer positions at Tech Corp, Innovation Inc, and 3 other companies.',
    received: new Date(2023, 3, 11, 8, 15),
    priority: 'low',
    hasEvent: false,
    isRead: false,
    category: 'networking'
  }
];

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filter, setFilter] = useState('all');
  const [hasNewEmails, setHasNewEmails] = useState(false);
  
  // Get websocket context, including emails
  const { connected, emails, setEmails, lastMessage } = useWebSocket(); // Assume emails are now in context

  // State for aggregated events
  const [allEvents, setAllEvents] = useState([]);

  useEffect(() => {
    // Fetch initial emails when component mounts (optional, context might handle this)
    const fetchInitialEmails = async () => {
      try {
        setLoading(true);
        // Replace with API call if context doesn't fetch initially
        // const response = await fetch('/emails?limit=50'); // Fetch more initially?
        // if (!response.ok) {
        //   throw new Error('Failed to fetch initial emails');
        // }
        // const data = await response.json();
        // setEmails(data);
        // For now, assume context provides emails
        setLoading(false);
      } catch (err) {
        console.error('Initial Email Fetch Error:', err);
        // setEmails([]); // Handle error case
        setError('Failed to load emails.');
        setLoading(false);
      }
    };

    if (!emails || emails.length === 0) {
       // fetchInitialEmails(); // Uncomment if context doesn't pre-load emails
       setLoading(false); // If context is empty, stop loading
    }
    else {
        setLoading(false); // Emails already loaded from context
    }

  }, []); // Run only once on mount

  // Process emails from WebSocket context to extract events
  useEffect(() => {
    if (emails && emails.length > 0) {
       const extractedEvents = emails.flatMap(email => 
           (email.events || []).map(event => ({
               ...event, // Spread event properties (summary, date, etc.)
               id: `${email.id}-${event.date || Math.random()}`, // Create a unique ID for the event item
               emailId: email.id,
               emailSubject: email.subject, // Include subject for context
               emailImportance: email.importance || 1 // Use email importance
           }))
       );
       
       // Sort events by date (newest first for upcoming? Or oldest first?)
       extractedEvents.sort((a, b) => {
           try {
               const dateA = parseISO(a.date || a.start?.dateTime || '1970-01-01');
               const dateB = parseISO(b.date || b.start?.dateTime || '1970-01-01');
               return dateA - dateB; // Sort oldest first for upcoming
           } catch (e) {
               return 0;
           }
       });

       setAllEvents(extractedEvents);
    } else {
        setAllEvents([]); // Clear events if no emails
    }
  }, [emails]); // Re-run whenever emails array changes

  const handleEmailClick = (emailId) => {
    navigate(`/email/${emailId}`);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    switch (newValue) {
      case 0:
        setFilter('all');
        break;
      case 1:
        setFilter('high');
        break;
      case 2:
        setFilter('work');
        break;
      default:
        setFilter('all');
    }
  };

  const filteredEmails = emails.filter(email => {
    if (filter === 'all') return true;
    if (filter === 'high') return email.importance === 3;
    if (filter === 'work') return email.category === 'work'; // Assuming category exists
    return true;
  });

  // Sort emails by importance and date
  const sortedEmails = [...filteredEmails].sort((a, b) => {
    const importanceA = a.importance || 0;
    const importanceB = b.importance || 0;
    if (importanceB !== importanceA) {
      return importanceB - importanceA; // Higher importance first
    }
    try {
        const dateA = parseISO(a.date || '1970-01-01');
        const dateB = parseISO(b.date || '1970-01-01');
        return dateB - dateA; // Newest date first
    } catch(e) { return 0; }
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Email Dashboard
          {!connected && <Typography color="error" variant="caption" sx={{ ml: 2 }}>
            (Offline)
          </Typography>}
        </Typography>
        {/* Removed Refresh/Filter buttons for simplicity, add back if needed */}
      </Box>

      <Grid container spacing={3}>
        {/* Email Section */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
              <Tab label="All Emails" />
              <Tab label="High Priority" />
              <Tab label="Work Related" />
            </Tabs>
          </Paper>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          ) : sortedEmails.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>No emails found.</Alert>
          ) : (
            sortedEmails.map((email) => (
              <EmailCard 
                key={email.id} 
                email={email} 
                // Removed star/delete/archive handlers, manage state elsewhere
                onClick={() => handleEmailClick(email.id)} // Ensure card click works
              />
            ))
          )}
        </Grid>

        {/* Reminders Section - Pass extracted events */}
        <Grid item xs={12} md={4}>
          <ReminderList eventsData={allEvents} limit={10} /> {/* Pass eventsData */}
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;