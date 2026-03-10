import { Router } from "express";
import { z } from "zod";
import { notificationSettingsDb } from "../services/database.js";

const router = Router();

// Notification settings validation schema
const settingsSchema = z.object({
  userId: z.string(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  activityReminders: z.boolean().optional(),
  broadcastMessages: z.boolean().optional(),
  registrationUpdates: z.boolean().optional(),
});

// Get notification settings for a user
router.get("/:userId", (req, res) => {
  const settings = notificationSettingsDb.findMany(
    s => s.userId === req.params.userId
  );
  
  if (settings.length === 0) {
    // Return default settings
    return res.json({
      userId: req.params.userId,
      emailNotifications: true,
      pushNotifications: true,
      activityReminders: true,
      broadcastMessages: true,
      registrationUpdates: true,
    });
  }
  
  res.json(settings[0]);
});

// Update notification settings
router.put("/:userId", (req, res) => {
  const settings = notificationSettingsDb.findMany(
    s => s.userId === req.params.userId
  );
  
  try {
    const data = settingsSchema.parse(req.body);
    
    if (settings.length > 0) {
      // Update existing settings
      const updated = notificationSettingsDb.update(settings[0].id, data);
      return res.json(updated);
    } else {
      // Create new settings
      const newSettings = {
        id: `notif_settings_${Date.now()}`,
        ...data,
        emailNotifications: data.emailNotifications ?? true,
        pushNotifications: data.pushNotifications ?? true,
        activityReminders: data.activityReminders ?? true,
        broadcastMessages: data.broadcastMessages ?? true,
        registrationUpdates: data.registrationUpdates ?? true,
      };
      notificationSettingsDb.create(newSettings);
      return res.json(newSettings);
    }
  } catch (error) {
    res.status(400).json({ error: "Invalid data" });
  }
});

export default router;

