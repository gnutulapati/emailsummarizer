import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  IconButton,
  Popover,
  Paper,
  Button,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { format, isToday, isTomorrow } from 'date-fns';

// Mock data for notifications
const mockNotifications = [
  {
    id: 1,
    type: 'email',
    title: 'Urgent: Project Deadline Update',
    message: 'The project deadline has been moved up to next Friday.',
    time: new Date(2023, 3, 15, 9, 30),
    priority: 'high',
    read: false,
    emailId: '1'
  },
  {
    id: 2,
    type: 'event',
    title: 'Company-wide Meeting',
    message: 'Reminder: Company meeting in 30 minutes',
    time: new Date(2023, 3, 15, 10, 0),
    priority: 'medium',
    read: false,
    emailId: '2'
  },
  {
    id: 3,
    type: 'email',
    title: 'Your Order Has Shipped',
    message: 'Your recent order #12345 has shipped and is expected to arrive on Wednesday.',
    time: new Date(2023, 3, 13, 11, 20),
    priority: 'low',
    read: true,
    emailId: '3'
  },
  {
    id: 4,
    type: 'event',
    title: 'Weekly Sprint Planning',
    message: 'Sprint planning meeting tomorrow at 9 AM',
    time: new Date(2023, 3, 17, 9, 0),
    priority: 'medium',
    read: false,
    emailId: '4'
  }
];

function NotificationPanel() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    // In a real app, this would fetch from an API
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(notification => !notification.read).length);
  }, []);

  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationItemClick = (notification) => {
    // Mark as read
    setNotifications(prev => 
      prev.map(item => 
        item.id === notification.id ? { ...item, read: true } : item
      )
    );
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Navigate based on notification type
    if (notification.type === 'email') {
      navigate(`/email/${notification.emailId}`);
    } else if (notification.type === 'event') {
      navigate('/calendar');
    }
    
    handleClose();
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => 
      prev.map(item => ({ ...item, read: true }))
    );
    setUnreadCount(0);
  };

  const handleDismiss = (event, notificationId) => {
    event.stopPropagation();
    const notification = notifications.find(n => n.id === notificationId);
    
    // If dismissing an unread notification, decrease the count
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    // Remove the notification
    setNotifications(prev => 
      prev.filter(item => item.id !== notificationId)
    );
  };

  const formatNotificationTime = (time) => {
    if (isToday(time)) {
      return `Today at ${format(time, 'h:mm a')}`;
    } else if (isTomorrow(time)) {
      return `Tomorrow at ${format(time, 'h:mm a')}`;
    } else {
      return format(time, 'MMM d, yyyy h:mm a');
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton color="inherit" onClick={handleNotificationClick}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ width: 320, maxHeight: 400 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Notifications</Typography>
            {unreadCount > 0 && (
              <Button size="small" onClick={handleMarkAllRead}>
                Mark all read
              </Button>
            )}
          </Box>
          
          <Divider />
          
          {notifications.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No notifications
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 320, overflow: 'auto' }}>
              {notifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <ListItem 
                    button 
                    alignItems="flex-start"
                    onClick={() => handleNotificationItemClick(notification)}
                    sx={{
                      bgcolor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                      '&:hover': {
                        bgcolor: notification.read ? 'rgba(0, 0, 0, 0.04)' : 'rgba(25, 118, 210, 0.12)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                      {notification.type === 'email' ? (
                        <EmailIcon color={notification.priority === 'high' ? 'error' : 'primary'} />
                      ) : (
                        <EventIcon color={notification.priority === 'high' ? 'error' : 'primary'} />
                      )}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ pr: 4 }}>
                          <Typography 
                            variant="subtitle2" 
                            component="span"
                            sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}
                          >
                            {notification.title}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span" color="text.primary">
                            {notification.message}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.875rem', color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {formatNotificationTime(notification.time)}
                            </Typography>
                          </Box>
                        </>
                      }
                    />
                    
                    <IconButton 
                      size="small" 
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                      onClick={(e) => handleDismiss(e, notification.id)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
          
          <Box sx={{ p: 1.5, borderTop: '1px solid rgba(0, 0, 0, 0.12)', textAlign: 'center' }}>
            <Button size="small" onClick={() => navigate('/settings')}>
              Notification Settings
            </Button>
          </Box>
        </Paper>
      </Popover>
    </>
  );
}

export default NotificationPanel;