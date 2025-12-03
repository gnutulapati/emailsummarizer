import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  IconButton,
  Button,
  Card,
  CardContent,
  Tooltip,
  CircularProgress,
  Badge
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Alarm as AlarmIcon,
  Email as EmailIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon,
  Refresh as RefreshIcon,
  LabelImportant as LabelImportantIcon
} from '@mui/icons-material';
import { format, isToday, isTomorrow, isPast, addDays, parseISO } from 'date-fns';

// Removed mock data

// Component to display a single reminder item
function ReminderItem({ reminder, onReminderClick }) {
  const navigate = useNavigate();

  // Format event date safely
  let formattedDate = "Invalid date";
  let isUpcoming = false;
  try {
    const date = parseISO(reminder.date || reminder.start?.dateTime);
    formattedDate = format(date, 'MMM d, h:mm a');
    isUpcoming = !isPast(date);
  } catch (e) {
    // Keep formattedDate as "Invalid date"
  }

  // Determine importance color
  const importanceColor = 
      reminder.emailImportance === 3 ? 'error' : // High importance
      reminder.emailImportance === 2 ? 'warning' : // Medium importance
      'action'; // Default/Low importance

  // Handle clicking the reminder item
  const handleClick = () => {
      if (reminder.emailId) {
          navigate(`/email/${reminder.emailId}`);
      } else {
          // Optionally navigate somewhere else if no email ID
          console.warn("Reminder has no associated email ID:", reminder);
      }
  };

  // Only render if the date is valid and upcoming (or adjust as needed)
  if (!isUpcoming || formattedDate === "Invalid date") {
    return null; 
  }

  return (
    <ListItem 
        button 
        onClick={handleClick} 
        sx={{ mb: 1, bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 1 }}
        secondaryAction={
          <Tooltip title={`Importance: ${reminder.emailImportance === 3 ? 'High' : reminder.emailImportance === 2 ? 'Medium' : 'Low'}`}>
            <LabelImportantIcon color={importanceColor} />
          </Tooltip>
        }
    >
      <ListItemIcon sx={{ minWidth: 40 }}>
        <NotificationsIcon color="primary" />
      </ListItemIcon>
      <ListItemText
        primary={reminder.summary || reminder.description || 'Reminder'} // Use summary or description
        secondary={`${formattedDate}`}
      />
    </ListItem>
  );
}

// Main ReminderList component
function ReminderList({ eventsData = [], limit = 10, showTitle = true }) {
  const navigate = useNavigate();
  
  // Remove API fetching logic (loading, error, fetchReminders, etc.)
  // const [reminders, setReminders] = useState([]);
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);
  // const [hasNewEvents, setHasNewEvents] = useState(false);

  // Process the eventsData prop directly
  const upcomingReminders = eventsData
    .map(event => {
      try {
        // Attempt to parse the date to ensure it's valid
        const date = parseISO(event.date || event.start?.dateTime);
        return { ...event, parsedDate: date }; // Add parsed date for filtering/sorting
      } catch (e) {
        return { ...event, parsedDate: null }; // Mark as invalid if parsing fails
      }
    })
    .filter(event => event.parsedDate && !isPast(event.parsedDate)) // Filter out past or invalid dates
    .sort((a, b) => a.parsedDate - b.parsedDate) // Sort by date (upcoming first)
    .slice(0, limit); // Apply limit

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      {showTitle && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <NotificationsIcon sx={{ mr: 1 }} />
              Upcoming Reminders
            </Box>
          </Typography>
          {/* Removed Refresh/Add buttons for simplicity */}
        </Box>
      )}

      <Divider sx={{ mb: 2 }} />

      {upcomingReminders.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
          No upcoming reminders found in recent emails.
        </Typography>
      ) : (
        <List dense> {/* Use dense for a tighter list */}
          {upcomingReminders.map((reminder) => (
            <ReminderItem 
              key={reminder.id} 
              reminder={reminder} 
              // Removed completion/delete handlers for now
            />
          ))}
        </List>
      )}
    </Paper>
  );
}

export default ReminderList;