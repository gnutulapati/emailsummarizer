import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Badge
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Event as EventIcon,
  Add as AddIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';
import { useWebSocket } from '../WebSocketContext';

// Mock data for development
const mockEvents = [
  {
    id: '1',
    title: 'Project Deadline',
    description: 'Final deliverables due for the Q2 project',
    date: new Date(2023, 3, 21, 17, 0),
    location: 'Online Submission',
    priority: 'high',
    emailId: '1',
    type: 'deadline'
  },
  {
    id: '2',
    title: 'Company-wide Meeting',
    description: 'Quarterly company update with all departments',
    date: new Date(2023, 3, 15, 10, 0),
    location: 'Main Conference Room',
    priority: 'medium',
    emailId: '2',
    type: 'meeting'
  },
  {
    id: '3',
    title: 'Sprint Planning',
    description: 'Weekly sprint planning for the development team',
    date: new Date(2023, 3, 17, 9, 0),
    location: 'Team Room B',
    priority: 'medium',
    emailId: '4',
    type: 'meeting'
  },
  {
    id: '4',
    title: 'Client Presentation',
    description: 'Present the new product features to the client',
    date: new Date(2023, 3, 19, 14, 0),
    location: 'Virtual Meeting',
    priority: 'high',
    emailId: null,
    type: 'meeting'
  },
  {
    id: '5',
    title: 'Report Submission',
    description: 'Submit monthly progress report',
    date: new Date(2023, 3, 28, 17, 0),
    location: null,
    priority: 'medium',
    emailId: null,
    type: 'deadline'
  }
];

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [hasNewEvents, setHasNewEvents] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date(),
    location: '',
    priority: 'medium',
    type: 'meeting'
  });

  // Get websocket context
  const { connected, newEvents } = useWebSocket();

  useEffect(() => {
    // Fetch events from API
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/events');
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        // Process the event data from the API
        const processedEvents = data.map(event => ({
          id: event.id || `event-${Math.random().toString(36).substr(2, 9)}`,
          title: event.title || event.description.substring(0, 30),
          description: event.description,
          date: event.date ? new Date(event.date) : new Date(),
          location: event.location || null,
          priority: event.priority || 'medium',
          type: event.event_type || 'meeting',
          isToday: event.is_today || false,
          isTomorrow: event.is_tomorrow || false,
          daysUntil: event.days_until || 0
        }));
        setEvents(processedEvents);
        setLoading(false);
      } catch (err) {
        console.error('API Error:', err);
        setEvents(mockEvents); // Use mock data as fallback
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Handle new events coming from WebSocket
  useEffect(() => {
    if (newEvents && newEvents.all_events && newEvents.all_events.length > 0) {
      // Process new events to match our format
      const processedNewEvents = newEvents.all_events.map(event => ({
        id: event.id || `event-${Math.random().toString(36).substr(2, 9)}`,
        title: event.title || event.description.substring(0, 30),
        description: event.description,
        date: event.date ? new Date(event.date) : new Date(),
        location: event.location || null,
        priority: event.priority || 'medium',
        type: event.event_type || 'meeting',
        isToday: event.is_today || false,
        isTomorrow: event.is_tomorrow || false,
        daysUntil: event.days_until || 0
      }));
      
      // Check if we already have these events (using description as a simple key)
      const existingDescriptions = new Set(events.map(event => event.description));
      const uniqueNewEvents = processedNewEvents.filter(
        event => !existingDescriptions.has(event.description)
      );
      
      if (uniqueNewEvents.length > 0) {
        console.log('Adding new events to calendar:', uniqueNewEvents);
        setEvents(prevEvents => [...uniqueNewEvents, ...prevEvents]);
        setHasNewEvents(true);
      }
    }
  }, [newEvents, events]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchEvents();
    setHasNewEvents(false);
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      // Process the event data from the API
      const processedEvents = data.map(event => ({
        id: event.id || `event-${Math.random().toString(36).substr(2, 9)}`,
        title: event.title || event.description.substring(0, 30),
        description: event.description,
        date: event.date ? new Date(event.date) : new Date(),
        location: event.location || null,
        priority: event.priority || 'medium',
        type: event.event_type || 'meeting',
        isToday: event.is_today || false,
        isTomorrow: event.is_tomorrow || false,
        daysUntil: event.days_until || 0
      }));
      setEvents(processedEvents);
      setLoading(false);
    } catch (err) {
      console.error('API Error:', err);
      // Use mock data as fallback in development
      if (process.env.NODE_ENV === 'development') {
        setEvents(mockEvents);
      }
      setLoading(false);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    const eventsOnDate = events.filter(event => {
      if (!event.date) return false;
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      return isSameDay(eventDate, date);
    });
    setSelectedEvents(eventsOnDate);
    setOpenEventDialog(true);
  };

  const handleCloseEventDialog = () => {
    setOpenEventDialog(false);
  };

  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  const handleAddEvent = () => {
    const newEventWithId = {
      ...newEvent,
      id: `${events.length + 1}`,
      emailId: null,
      date: new Date(newEvent.date)
    };
    setEvents([...events, newEventWithId]);
    setNewEvent({
      title: '',
      description: '',
      date: new Date(),
      location: '',
      priority: 'medium',
      type: 'meeting'
    });
    setOpenAddDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent({
      ...newEvent,
      [name]: value
    });
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get events for each day
  const getEventsForDay = (day) => {
    return events.filter(event => {
      if (!event.date) return false;
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      return isSameDay(eventDate, day);
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Calendar
          {!connected && <Typography color="error" variant="caption" sx={{ ml: 2 }}>
            (Offline)
          </Typography>}
        </Typography>
        <Box>
          <Badge
            color="secondary"
            badgeContent={hasNewEvents ? "New" : 0}
            overlap="circular"
            sx={{ mr: 2 }}
          >
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              size="small"
            >
              Refresh
            </Button>
          </Badge>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Add Event
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <IconButton onClick={handlePrevMonth}>
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="h5">
                {format(currentDate, 'MMMM yyyy')}
              </Typography>
              <IconButton onClick={handleNextMonth}>
                <ChevronRightIcon />
              </IconButton>
            </Box>

            <Grid container spacing={1} sx={{ mt: 2 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Grid item xs={12/7} key={day}>
                  <Typography variant="subtitle2" align="center" fontWeight="bold">
                    {day}
                  </Typography>
                </Grid>
              ))}

              {calendarDays.map((day) => {
                const dayEvents = getEventsForDay(day);
                const hasHighPriority = dayEvents.some(event => 
                  event.priority === 'high' || (event.importance && event.importance >= 2)
                );
                
                return (
                  <Grid item xs={12/7} key={day.toString()}>
                    <Paper
                      elevation={0}
                      sx={{
                        height: 100,
                        p: 1,
                        border: '1px solid #eee',
                        bgcolor: isToday(day) ? 'rgba(25, 118, 210, 0.1)' : 'white',
                        cursor: 'pointer',
                        borderLeft: hasHighPriority ? '3px solid #f44336' : undefined,
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                      onClick={() => handleDateClick(day)}
                    >
                      <Typography 
                        align="center" 
                        sx={{ 
                          fontWeight: isToday(day) ? 'bold' : 'normal',
                          color: isToday(day) ? 'primary.main' : 'inherit'
                        }}
                      >
                        {format(day, 'd')}
                      </Typography>
                      
                      {/* Show up to 3 events for this day */}
                      {dayEvents.slice(0, 3).map((event, index) => (
                        <Box 
                          key={event.id} 
                          sx={{ 
                            p: 0.5, 
                            borderRadius: 1, 
                            mb: 0.5, 
                            fontSize: '0.7rem',
                            bgcolor: event.priority === 'high' || (event.importance && event.importance >= 2) 
                              ? 'error.light' 
                              : event.priority === 'medium' || (event.importance && event.importance === 2)
                              ? 'warning.light'
                              : 'info.light',
                            color: 'white',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {event.title || event.description.substring(0, 15)}...
                        </Box>
                      ))}
                      
                      {/* If there are more events than we can display */}
                      {dayEvents.length > 3 && (
                        <Typography align="center" variant="caption" color="text.secondary">
                          +{dayEvents.length - 3} more
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </>
      )}

      {/* Dialog for viewing events on a specific date */}
      <Dialog open={openEventDialog} onClose={handleCloseEventDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </DialogTitle>
        <DialogContent dividers>
          {selectedEvents.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No events scheduled for this day.
            </Typography>
          ) : (
            selectedEvents.map((event) => (
              <Card key={event.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {event.title || event.description.substring(0, 30)}
                  </Typography>
                  
                  <Chip 
                    size="small" 
                    label={event.type || event.eventType || 'Event'} 
                    color={
                      event.priority === 'high' || (event.importance && event.importance >= 2)
                        ? 'error'
                        : event.priority === 'medium' || (event.importance && event.importance === 2)
                        ? 'warning'
                        : 'primary'
                    }
                    sx={{ mb: 1 }}
                  />
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                    <DescriptionIcon fontSize="small" sx={{ mr: 1, mt: 0.3 }} />
                    <Typography variant="body2">
                      {event.description}
                    </Typography>
                  </Box>
                  
                  {event.time && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AccessTimeIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {event.time}
                      </Typography>
                    </Box>
                  )}
                  
                  {event.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {event.location}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEventDialog}>Close</Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => {
              handleCloseEventDialog();
              handleOpenAddDialog();
            }}
          >
            Add Event
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for adding a new event */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Event</DialogTitle>
        <DialogContent dividers>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="title"
              label="Event Title"
              name="title"
              value={newEvent.title}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="description"
              label="Description"
              name="description"
              multiline
              rows={3}
              value={newEvent.description}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="date"
              label="Date"
              name="date"
              type="date"
              value={format(new Date(newEvent.date), 'yyyy-MM-dd')}
              onChange={handleInputChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              margin="normal"
              fullWidth
              id="location"
              label="Location"
              name="location"
              value={newEvent.location}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="type"
              label="Event Type"
              name="type"
              select
              SelectProps={{
                native: true,
              }}
              value={newEvent.type}
              onChange={handleInputChange}
            >
              <option value="meeting">Meeting</option>
              <option value="deadline">Deadline</option>
              <option value="reminder">Reminder</option>
              <option value="task">Task</option>
            </TextField>
            <TextField
              margin="normal"
              required
              fullWidth
              id="priority"
              label="Priority"
              name="priority"
              select
              SelectProps={{
                native: true,
              }}
              value={newEvent.priority}
              onChange={handleInputChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAddEvent}
            disabled={!newEvent.title || !newEvent.description}
          >
            Add Event
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Calendar;