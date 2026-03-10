import { Router } from "express";
import { z } from "zod";
import { broadcastMessagesDb, usersDb, notificationsDb } from "../services/database.js";
import { sendBroadcastMessage } from "../services/email.js";

const router = Router();

// Broadcast message validation schema
const broadcastSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  targetRole: z.enum(["all", "admin", "student"]),
  sendEmail: z.boolean().optional(),
});

// Get all broadcast messages
router.get("/", (_req, res) => {
  const messages = broadcastMessagesDb.findAll();
  res.json(messages);
});

// Get broadcast by ID
router.get("/:id", (req, res) => {
  const message = broadcastMessagesDb.findById(req.params.id);
  if (!message) {
    return res.status(404).json({ error: "Broadcast message not found" });
  }
  res.json(message);
});

// Create and send broadcast message
router.post("/", async (req, res) => {
  try {
    const data = broadcastSchema.parse(req.body);
    
    // Get users based on target role
    let users: any[] = [];
    if (data.targetRole === "all") {
      users = usersDb.findAll();
    } else {
      users = usersDb.findMany(u => u.role === data.targetRole);
    }
    
    // Create broadcast message
    const broadcast = {
      id: `broadcast_${Date.now()}`,
      title: data.title,
      message: data.message,
      targetRole: data.targetRole,
      createdBy: "admin", // In production, get from auth
      createdAt: new Date().toISOString(),
    };
    
    broadcastMessagesDb.create(broadcast);
    
    // Create notifications for all users
    users.forEach(user => {
      const notification = {
        id: `notif_${Date.now()}_${user.id}`,
        userId: user.id,
        title: data.title,
        message: data.message,
        type: "info" as const,
        isBroadcast: true,
        read: false,
        createdAt: new Date().toISOString(),
      };
      notificationsDb.create(notification);
    });
    
    // Send emails if requested
    if (data.sendEmail) {
      const emails = users.map(u => u.email).filter(Boolean);
      if (emails.length > 0) {
        await sendBroadcastMessage(emails, data.title, data.message);
      }
    }
    
    res.status(201).json({
      ...broadcast,
      recipients: users.length,
    });
  } catch (error) {
    console.error("Broadcast error:", error);
    res.status(400).json({ error: "Invalid data" });
  }
});

// Delete broadcast message
router.delete("/:id", (req, res) => {
  const message = broadcastMessagesDb.findById(req.params.id);
  if (!message) {
    return res.status(404).json({ error: "Broadcast message not found" });
  }
  
  broadcastMessagesDb.delete(req.params.id);
  res.json({ success: true });
});

export default router;

