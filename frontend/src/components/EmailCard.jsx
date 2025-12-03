// frontend/src/components/EmailCard.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  Divider,
  Button,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Avatar,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { format, parseISO } from "date-fns";

function splitToBullets(text = "") {
  if (!text) return [];
  // prefer newlines
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length > 1) return lines;
  // fallback: split on sentence endings
  return text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function EmailCard({ email = {}, onStar, onDelete, onArchive }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const bullets = useMemo(
    () => splitToBullets(email.summary || email.body || ""),
    [email.summary, email.body]
  );

  const handleEmailClick = () => navigate(`/email/${email.id}`);

  let formattedReceivedDate = "Unknown";
  try {
    if (email.date)
      formattedReceivedDate = format(
        parseISO(email.date),
        "MMM d, yyyy h:mm a"
      );
    else if (email.received)
      formattedReceivedDate = format(
        new Date(email.received),
        "MMM d, yyyy h:mm a"
      );
  } catch (e) {
    /* ignore */
  }

  const initials =
    (email.sender || "")
      .split(/\s+/)
      .map((x) => x[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <Card
      sx={{
        mb: 2,
        bgcolor: "white",
        transition: "transform 0.15s, box-shadow 0.15s",
        "&:hover": { transform: "translateY(-3px)", boxShadow: 3 },
        borderLeft:
          email.importance === 3
            ? "4px solid #d32f2f"
            : email.importance === 2
            ? "4px solid #f57c00"
            : email.importance === 1
            ? "4px solid #9e9e9e"
            : "none",
      }}
    >
      <CardActionArea onClick={handleEmailClick}>
        <CardContent>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                minWidth: 0,
              }}
            >
              <Avatar sx={{ bgcolor: "primary.main", width: 48, height: 48 }}>
                {initials}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap variant="subtitle1" fontWeight="700">
                  {email.subject || "No subject"}
                </Typography>
                <Typography noWrap variant="body2" color="text.secondary">
                  {email.sender || "Unknown sender"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  {formattedReceivedDate}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
              {email.importance === 3 && (
                <Chip label="Important" color="error" size="small" />
              )}
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((p) => !p);
                }}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* teaser */}
          <Typography variant="body2" color="text.primary" noWrap>
            {bullets.length > 0
              ? bullets[0]
              : email.summary || "No summary available"}
          </Typography>
        </CardContent>
      </CardActionArea>

      {/* expanded bullets */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 0 }}>
          {bullets.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No summary available.
            </Typography>
          ) : (
            <List dense>
              {bullets.map((b, i) => (
                <ListItem key={i} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={b}
                    primaryTypographyProps={{ variant: "body2" }}
                  />
                </ListItem>
              ))}
            </List>
          )}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
              mt: 1,
              px: 1,
            }}
          >
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/email/${email.id}`);
              }}
            >
              Open Full
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={(e) => {
                e.stopPropagation(); /* hook actions here */
              }}
            >
              Mark Read
            </Button>
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
}
