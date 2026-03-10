import { Router } from "express";
import { z } from "zod";
import { notificationsDb } from "../services/database.js";

const router = Router();

// Notification validation schema
const notificationSchema = z.object({
  userId: z.string().optional(),
  targetRole: z.enum(["admin", "student"]).optional(),
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(["info", "success", "warning", "error"]).default("info"),
  isBroadcast: z.boolean().optional(),
});

// Get all notifications
router.get("/", (_req, res) => {
  const notifications = notificationsDb.findAll();
  res.json(notifications);
});

// Get notifications for a user
router.get("/user/:userId", (req, res) => {
  const notifications = notificationsDb.findMany(
    n => n.userId === req.params.userId
  );
  res.json(notifications);
});

// Get notifications by role
router.get("/role/:role", (req, res) => {
  const notifications = notificationsDb.findMany(
    n => n.targetRole === req.params.role || n.targetRole === undefined
  );
  res.json(notifications);
});

// Get unread notifications count
router.get("/unread/:userId", (req, res) => {
  const notifications = notificationsDb.findMany(
    n => n.userId === req.params.userId && !n.read
  );
  res.json({ count: notifications.length });
});

// Mark notification as read
router.put("/:id/read", (req, res) => {
  const notification = notificationsDb.findById(req.params.id);
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }
  
  notificationsDb.update(req.params.id, { read: true });
  res.json({ success: true });
});

// Mark all notifications as read for a user
router.put("/read-all/:userId", (req, res) => {
  const notifications = notificationsDb.findMany(
    n => n.userId === req.params.userId && !n.read
  );
  
  notifications.forEach(n => {
    notificationsDb.update(n.id, { read: true });
  });
  
  res.json({ success: true });
});

// Create notification
router.post("/", (req, res) => {
  try {
    const data = notificationSchema.parse(req.body);
    
    const notification = {
      id: `notif_${Date.now()}`,
      ...data,
      read: false,
      createdAt: new Date().toISOString(),
    };
    
    notificationsDb.create(notification);
    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ error: "Invalid data" });
  }
});

// Delete notification
router.delete("/:id", (req, res) => {
  const notification = notificationsDb.findById(req.params.id);
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }
  
  notificationsDb.delete(req.params.id);
  res.json({ success: true });
});

// Delete all read notifications for a user
router.delete("/clear/:userId", (req, res) => {
  const notifications = notificationsDb.findMany(
    n => n.userId === req.params.userId && n.read
  );
  
  notifications.forEach(n => {
    notificationsDb.delete(n.id);
  });
  
  res.json({ success: true });
});

export default router;

