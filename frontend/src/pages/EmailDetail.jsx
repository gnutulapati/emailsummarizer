import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
} from "@mui/icons-material";
import { format } from "date-fns";

// Mock data for development
const mockEmails = [
  {
    id: "1",
    sender: "Project Manager <pm@company.com>",
    subject: "Urgent: Project Deadline Update",
    summary:
      "The project deadline has been moved up to next Friday. Please prepare all deliverables by Thursday EOD for final review.",
    body: `Dear Team,

I'm writing to inform you that our client has requested an earlier delivery date for the current project. As a result, our deadline has been moved up to next Friday, April 21st.

Please adjust your schedules accordingly and prepare all deliverables by Thursday EOD for final review. If you anticipate any issues meeting this accelerated timeline, please let me know as soon as possible so we can discuss alternatives.

Key deliverables:
- Complete feature implementation
- Finalize documentation
- Prepare demo for client presentation
- Run final QA tests

I appreciate your flexibility and commitment to meeting our client's needs. Let me know if you have any questions or concerns.

Best regards,
Project Manager`,
    received: new Date(2023, 3, 15, 9, 30),
    priority: "high",
    hasEvent: true,
    eventDate: new Date(2023, 3, 21),
    isRead: false,
    category: "work",
    attachments: [],
    isStarred: false,
  },
  {
    id: "2",
    sender: "HR Department <hr@company.com>",
    subject: "Company-wide Meeting Tomorrow",
    summary:
      "Reminder about the company-wide meeting tomorrow at 10 AM in the main conference room. Attendance is mandatory.",
    body: `Hello everyone,

This is a reminder about the company-wide meeting scheduled for tomorrow, April 15th, at 10:00 AM in the main conference room.

The agenda includes:
1. Q1 performance review
2. New product announcements
3. Team restructuring updates
4. Open floor for questions

Attendance is mandatory for all employees. Please arrive 10 minutes early to ensure a prompt start. Coffee and light refreshments will be provided.

If you absolutely cannot attend, please notify your department head and schedule a follow-up meeting to review the content.

Thank you,
HR Department`,
    received: new Date(2023, 3, 14, 16, 45),
    priority: "medium",
    hasEvent: true,
    eventDate: new Date(2023, 3, 15, 10, 0),
    isRead: true,
    category: "work",
    attachments: [{ name: "meeting_agenda.pdf", size: "245 KB" }],
    isStarred: true,
  },
  {
    id: "3",
    sender: "Amazon <orders@amazon.com>",
    subject: "Your Order Has Shipped",
    summary:
      "Your recent order #12345 has shipped and is expected to arrive on Wednesday. Track your package with the provided link.",
    body: `Hello,

Great news! Your order #12345 has shipped and is on its way to you.

Order Details:
- Order #: 12345
- Placed on: April 10, 2023
- Expected delivery: Wednesday, April 17, 2023

You can track your package at any time by clicking the link below:
[Track Your Package]

If you have any questions about your order, please visit our Help Center or contact Customer Service.

Thank you for shopping with Amazon!

The Amazon Team`,
    received: new Date(2023, 3, 13, 11, 20),
    priority: "low",
    hasEvent: false,
    isRead: false,
    category: "shopping",
    attachments: [],
    isStarred: false,
  },
  {
    id: "4",
    sender: "Team Lead <lead@company.com>",
    subject: "Weekly Sprint Planning",
    summary:
      "Our weekly sprint planning meeting is scheduled for Monday at 9 AM. Please prepare your updates and be ready to discuss your tasks for the upcoming sprint.",
    body: `Hi team,

Just a reminder that our weekly sprint planning meeting is scheduled for Monday, April 17th, at 9:00 AM in Team Room B.

Please come prepared with:
- Status updates on your current tasks
- Any blockers or issues you're facing
- Estimated completion times for ongoing work
- Capacity for the upcoming sprint

We'll be planning our work for the next two weeks, so it's important that everyone participates actively.

See you all on Monday,
Team Lead`,
    received: new Date(2023, 3, 12, 17, 0),
    priority: "medium",
    hasEvent: true,
    eventDate: new Date(2023, 3, 17, 9, 0),
    isRead: true,
    category: "work",
    attachments: [
      { name: "sprint_backlog.xlsx", size: "178 KB" },
      { name: "previous_sprint_review.pdf", size: "320 KB" },
    ],
    isStarred: false,
  },
  {
    id: "5",
    sender: "LinkedIn <notifications@linkedin.com>",
    subject: "New job opportunities matching your profile",
    summary:
      "We found 5 new job opportunities that match your profile. Senior Developer positions at Tech Corp, Innovation Inc, and 3 other companies.",
    body: `Hello,

Based on your profile and preferences, we've found 5 new job opportunities that might interest you:

1. Senior Software Developer at Tech Corp
   Location: San Francisco, CA (Remote available)
   Posted: 2 days ago

2. Lead Developer at Innovation Inc
   Location: Austin, TX
   Posted: 1 week ago

3. Full Stack Engineer at StartUp Solutions
   Location: Remote
   Posted: 3 days ago

4. Senior React Developer at WebFront Technologies
   Location: New York, NY (Hybrid)
   Posted: 5 days ago

5. Software Architect at Enterprise Systems
   Location: Chicago, IL
   Posted: 1 day ago

Click below to view these jobs and apply:
[View Jobs]

You're receiving this email because you opted in to receive job alerts from LinkedIn.

LinkedIn Professional Team`,
    received: new Date(2023, 3, 11, 8, 15),
    priority: "low",
    hasEvent: false,
    isRead: false,
    category: "networking",
    attachments: [],
    isStarred: false,
  },
];

function EmailDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStarred, setIsStarred] = useState(false);

  useEffect(() => {
    // Simulate API call to fetch email details
    const fetchEmailDetails = async () => {
      try {
        // In a real app, this would be an API call
        setTimeout(() => {
          const foundEmail = mockEmails.find((email) => email.id === id);
          if (foundEmail) {
            setEmail(foundEmail);
            setIsStarred(foundEmail.isStarred);
          } else {
            setError("Email not found");
          }
          setLoading(false);
        }, 800);
      } catch (err) {
        setError("Failed to load email details. Please try again later.");
        setLoading(false);
      }
    };

    fetchEmailDetails();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleToggleStar = () => {
    setIsStarred(!isStarred);
    // In a real app, this would update the server
  };

  const handleDelete = () => {
    // In a real app, this would delete the email
    alert("Email deleted");
    navigate("/");
  };

  const handleArchive = () => {
    // In a real app, this would archive the email
    alert("Email archived");
    navigate("/");
  };

  const formatEmailBody = (body) => {
    return body.split("\n").map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };
  function splitToBullets(text = "") {
    if (!text) return [];
    const lines = text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (lines.length > 1) return lines;
    return text
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!email) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        Email not found
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            color="inherit"
            sx={{ cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            Dashboard
          </Link>
          <Typography color="text.primary">Email</Typography>
        </Breadcrumbs>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Typography variant="h5" component="h1" gutterBottom>
            {email.subject}
          </Typography>
          <Box>
            <IconButton
              onClick={handleToggleStar}
              color={isStarred ? "warning" : "default"}
            >
              {isStarred ? <StarIcon /> : <StarBorderIcon />}
            </IconButton>
            <IconButton onClick={handleArchive} color="default">
              <ArchiveIcon />
            </IconButton>
            <IconButton onClick={handleDelete} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              From: {email.sender}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {format(email.received, "EEEE, MMMM d, yyyy h:mm a")}
            </Typography>
          </Box>
          <Box>
            {email.priority === "high" && (
              <Chip
                label="Important"
                color="error"
                size="small"
                sx={{ mr: 1 }}
              />
            )}
            {email.hasEvent && (
              <Chip
                icon={<EventIcon />}
                label={format(email.eventDate, "MMM d, h:mm a")}
                color="primary"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 3 }}>
          {formatEmailBody(email.body)}
        </Typography>

        {email.attachments && email.attachments.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Attachments ({email.attachments.length})
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {email.attachments.map((attachment, index) => (
                <Chip
                  key={index}
                  label={`${attachment.name} (${attachment.size})`}
                  variant="outlined"
                  onClick={() => alert(`Downloading ${attachment.name}`)}
                  sx={{ mb: 1 }}
                />
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<ReplyIcon />}
            sx={{ mr: 2 }}
            onClick={() =>
              alert("Reply functionality would be implemented here")
            }
          >
            Reply
          </Button>
          <Button
            variant="outlined"
            startIcon={<ForwardIcon />}
            onClick={() =>
              alert("Forward functionality would be implemented here")
            }
          >
            Forward
          </Button>
        </Box>
      </Paper>

      {email.hasEvent && (
        <Card sx={{ mb: 3, borderLeft: "4px solid #1976d2" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Related Event
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <EventIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="body1">
                    {format(email.eventDate, "EEEE, MMMM d, yyyy")}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <AccessTimeIcon sx={{ mr: 1, color: "primary.main" }} />
                  <Typography variant="body1">
                    {format(email.eventDate, "h:mm a")}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate("/calendar")}
                  >
                    View in Calendar
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default EmailDetail;
