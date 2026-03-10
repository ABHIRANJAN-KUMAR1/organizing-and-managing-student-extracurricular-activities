import { Router } from "express";
import { z } from "zod";
import { remindersDb, activitiesDb, usersDb } from "../services/database.js";
import { sendActivityReminder } from "../services/email.js";

const router = Router();

// Reminder validation schema
const reminderSchema = z.object({
  activityId: z.string(),
  userId: z.string(),
  reminderTime: z.string(),
});

// Get all reminders
router.get("/", (_req, res) => {
  const reminders = remindersDb.findAll();
  res.json(reminders);
});

// Get reminder by ID
router.get("/:id", (req, res) => {
  const reminder = remindersDb.findById(req.params.id);
  if (!reminder) {
    return res.status(404).json({ error: "Reminder not found" });
  }
  res.json(reminder);
});

// Get reminders for an activity
router.get("/activity/:activityId", (req, res) => {
  const reminders = remindersDb.findMany(
    r => r.activityId === req.params.activityId
  );
  res.json(reminders);
});

// Get reminders for a user
router.get("/user/:userId", (req, res) => {
  const reminders = remindersDb.findMany(
    r => r.userId === req.params.userId
  );
  res.json(reminders);
});

// Get pending reminders (to be sent)
router.get("/pending/now", (_req, res) => {
  const now = new Date().toISOString();
  const reminders = remindersDb.findMany(
    r => !r.sent && r.reminderTime <= now
  );
  res.json(reminders);
});

// Create reminder
router.post("/", (req, res) => {
  try {
    const data = reminderSchema.parse(req.body);
    
    // Check if activity exists
    const activity = activitiesDb.findById(data.activityId);
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    // Check if user is registered
    if (!activity.currentParticipants.includes(data.userId)) {
      return res.status(400).json({ error: "User is not registered for this activity" });
    }
    
    const reminder = {
      id: `reminder_${Date.now()}`,
      ...data,
      sent: false,
      createdAt: new Date().toISOString(),
    };
    
    remindersDb.create(reminder);
    res.status(201).json(reminder);
  } catch (error) {
    res.status(400).json({ error: "Invalid data" });
  }
});

// Send reminder (mark as sent and optionally send email)
router.post("/:id/send", async (req, res) => {
  const reminder = remindersDb.findById(req.params.id);
  if (!reminder) {
    return res.status(404).json({ error: "Reminder not found" });
  }
  
  if (reminder.sent) {
    return res.status(400).json({ error: "Reminder already sent" });
  }
  
  // Get activity and user
  const activity = activitiesDb.findById(reminder.activityId);
  const user = usersDb.findById(reminder.userId);
  
  if (!activity || !user) {
    return res.status(404).json({ error: "Activity or user not found" });
  }
  
  // Send email reminder
  if (user.email) {
    await sendActivityReminder(
      user.email,
      user.name,
      activity.title,
      activity.date,
      activity.venue
    );
  }
  
  // Mark reminder as sent
  remindersDb.update(req.params.id, { sent: true });
  
  // Update activity reminder status
  activitiesDb.update(reminder.activityId, { reminderSent: true });
  
  res.json({ success: true });
});

// Delete reminder
router.delete("/:id", (req, res) => {
  const reminder = remindersDb.findById(req.params.id);
  if (!reminder) {
    return res.status(404).json({ error: "Reminder not found" });
  }
  
  remindersDb.delete(req.params.id);
  res.json({ success: true });
});

export default router;

