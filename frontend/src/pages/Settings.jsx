import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Alert,
  Snackbar,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon
} from '@mui/icons-material';

function Settings() {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({
    notifications: {
      enablePushNotifications: true,
      enableEmailNotifications: false,
      notifyHighPriorityOnly: false,
      notificationSound: true,
      reminderTime: 30, // minutes before event
    },
    email: {
      checkFrequency: 15, // minutes
      showSummaryLength: 'medium',
      defaultPriorityLevel: 'medium',
      autoArchiveRead: false,
      autoStarHighPriority: true,
    },
    accounts: [
      { id: 1, email: 'user@example.com', name: 'Work Email', isActive: true },
      { id: 2, email: 'personal@example.com', name: 'Personal Email', isActive: false },
    ],
    categories: [
      { id: 1, name: 'Work', color: '#1976d2', isEnabled: true },
      { id: 2, name: 'Personal', color: '#4caf50', isEnabled: true },
      { id: 3, name: 'Shopping', color: '#ff9800', isEnabled: true },
      { id: 4, name: 'Networking', color: '#9c27b0', isEnabled: true },
    ]
  });
  
  const [newAccount, setNewAccount] = useState({ email: '', name: '' });
  const [newCategory, setNewCategory] = useState({ name: '', color: '#1976d2' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSettingChange = (section, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [setting]: value
      }
    }));
  };

  const handleAddAccount = () => {
    if (!newAccount.email || !newAccount.name) return;
    
    setSettings(prev => ({
      ...prev,
      accounts: [
        ...prev.accounts,
        { 
          id: prev.accounts.length + 1, 
          email: newAccount.email, 
          name: newAccount.name, 
          isActive: false 
        }
      ]
    }));
    
    setNewAccount({ email: '', name: '' });
    setSnackbar({ open: true, message: 'Email account added successfully', severity: 'success' });
  };

  const handleDeleteAccount = (id) => {
    setSettings(prev => ({
      ...prev,
      accounts: prev.accounts.filter(account => account.id !== id)
    }));
    setSnackbar({ open: true, message: 'Email account removed', severity: 'info' });
  };

  const handleToggleAccount = (id) => {
    setSettings(prev => ({
      ...prev,
      accounts: prev.accounts.map(account => 
        account.id === id ? { ...account, isActive: !account.isActive } : account
      )
    }));
  };

  const handleAddCategory = () => {
    if (!newCategory.name) return;
    
    setSettings(prev => ({
      ...prev,
      categories: [
        ...prev.categories,
        { 
          id: prev.categories.length + 1, 
          name: newCategory.name, 
          color: newCategory.color, 
          isEnabled: true 
        }
      ]
    }));
    
    setNewCategory({ name: '', color: '#1976d2' });
    setSnackbar({ open: true, message: 'Category added successfully', severity: 'success' });
  };

  const handleToggleCategory = (id) => {
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.map(category => 
        category.id === id ? { ...category, isEnabled: !category.isEnabled } : category
      )
    }));
  };

  const handleDeleteCategory = (id) => {
    setSettings(prev => ({
      ...prev,
      categories: prev.categories.filter(category => category.id !== id)
    }));
    setSnackbar({ open: true, message: 'Category removed', severity: 'info' });
  };

  const handleSaveSettings = () => {
    // In a real app, this would save to backend
    setSnackbar({ open: true, message: 'Settings saved successfully', severity: 'success' });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
        >
          Save Settings
        </Button>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<NotificationsIcon />} label="Notifications" />
          <Tab icon={<EmailIcon />} label="Email Preferences" />
          <Tab icon={<SettingsIcon />} label="Accounts & Categories" />
        </Tabs>

        {/* Notifications Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notification Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.enablePushNotifications}
                      onChange={(e) => handleSettingChange('notifications', 'enablePushNotifications', e.target.checked)}
                    />
                  }
                  label="Enable Push Notifications"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.enableEmailNotifications}
                      onChange={(e) => handleSettingChange('notifications', 'enableEmailNotifications', e.target.checked)}
                    />
                  }
                  label="Send Email Notifications for Important Messages"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.notifyHighPriorityOnly}
                      onChange={(e) => handleSettingChange('notifications', 'notifyHighPriorityOnly', e.target.checked)}
                    />
                  }
                  label="Only Notify for High Priority Emails"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.notificationSound}
                      onChange={(e) => handleSettingChange('notifications', 'notificationSound', e.target.checked)}
                    />
                  }
                  label="Play Sound for Notifications"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography id="reminder-time-slider" gutterBottom>
                  Reminder Time Before Events (minutes)
                </Typography>
                <Slider
                  value={settings.notifications.reminderTime}
                  onChange={(e, newValue) => handleSettingChange('notifications', 'reminderTime', newValue)}
                  aria-labelledby="reminder-time-slider"
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={5}
                  max={60}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Email Preferences Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Email Preferences
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography id="check-frequency-slider" gutterBottom>
                  Check Email Frequency (minutes)
                </Typography>
                <Slider
                  value={settings.email.checkFrequency}
                  onChange={(e, newValue) => handleSettingChange('email', 'checkFrequency', newValue)}
                  aria-labelledby="check-frequency-slider"
                  valueLabelDisplay="auto"
                  step={5}
                  marks
                  min={5}
                  max={60}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="summary-length-label">Summary Length</InputLabel>
                  <Select
                    labelId="summary-length-label"
                    value={settings.email.showSummaryLength}
                    label="Summary Length"
                    onChange={(e) => handleSettingChange('email', 'showSummaryLength', e.target.value)}
                  >
                    <MenuItem value="short">Short (1-2 sentences)</MenuItem>
                    <MenuItem value="medium">Medium (3-4 sentences)</MenuItem>
                    <MenuItem value="long">Long (5+ sentences)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="default-priority-label">Default Priority Level</InputLabel>
                  <Select
                    labelId="default-priority-label"
                    value={settings.email.defaultPriorityLevel}
                    label="Default Priority Level"
                    onChange={(e) => handleSettingChange('email', 'defaultPriorityLevel', e.target.value)}
                  >
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.email.autoArchiveRead}
                      onChange={(e) => handleSettingChange('email', 'autoArchiveRead', e.target.checked)}
                    />
                  }
                  label="Automatically Archive Read Emails"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.email.autoStarHighPriority}
                      onChange={(e) => handleSettingChange('email', 'autoStarHighPriority', e.target.checked)}
                    />
                  }
                  label="Automatically Star High Priority Emails"
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Accounts & Categories Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={4}>
              {/* Email Accounts Section */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Email Accounts
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List>
                  {settings.accounts.map((account) => (
                    <ListItem key={account.id}>
                      <ListItemText
                        primary={account.name}
                        secondary={account.email}
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={account.isActive}
                              onChange={() => handleToggleAccount(account.id)}
                              size="small"
                            />
                          }
                          label=""
                        />
                        <IconButton edge="end" onClick={() => handleDeleteAccount(account.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                
                <Box sx={{ mt: 2, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Add New Email Account
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        value={newAccount.email}
                        onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Account Name"
                        value={newAccount.name}
                        onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddAccount}
                        disabled={!newAccount.email || !newAccount.name}
                        fullWidth
                      >
                        Add Account
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
              
              {/* Categories Section */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Email Categories
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List>
                  {settings.categories.map((category) => (
                    <ListItem key={category.id}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          bgcolor: category.color,
                          borderRadius: '50%',
                          mr: 2
                        }}
                      />
                      <ListItemText
                        primary={category.name}
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={category.isEnabled}
                              onChange={() => handleToggleCategory(category.id)}
                              size="small"
                            />
                          }
                          label=""
                        />
                        <IconButton edge="end" onClick={() => handleDeleteCategory(category.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                
                <Box sx={{ mt: 2, p: 2, border: '1px dashed #ccc', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Add New Category
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={8}>
                      <TextField
                        fullWidth
                        label="Category Name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        fullWidth
                        label="Color"
                        type="color"
                        value={newCategory.color}
                        onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddCategory}
                        disabled={!newCategory.name}
                        fullWidth
                      >
                        Add Category
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Settings;