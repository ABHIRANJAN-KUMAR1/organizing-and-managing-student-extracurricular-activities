import { Router } from "express";
import { z } from "zod";
import { activityHistoryDb, activitiesDb } from "../services/database.js";

const router = Router();

// Activity history validation schema
const historySchema = z.object({
  activityId: z.string(),
  userId: z.string(),
  status: z.enum(["registered", "waitlisted", "attended", "cancelled"]),
});

// Get all history entries
router.get("/", (_req, res) => {
  const history = activityHistoryDb.findAll();
  res.json(history);
});

// Get history by ID
router.get("/:id", (req, res) => {
  const entry = activityHistoryDb.findById(req.params.id);
  if (!entry) {
    return res.status(404).json({ error: "History entry not found" });
  }
  res.json(entry);
});

// Get history for a user
router.get("/user/:userId", (req, res) => {
  const history = activityHistoryDb.findMany(
    h => h.userId === req.params.userId
  );
  
  // Also get activity details
  const historyWithActivities = history.map(entry => {
    const activity = activitiesDb.findById(entry.activityId);
    return {
      ...entry,
      activityTitle: activity?.title,
      activityDate: activity?.date,
      activityVenue: activity?.venue,
    };
  });
  
  res.json(historyWithActivities);
});

// Get history for an activity
router.get("/activity/:activityId", (req, res) => {
  const history = activityHistoryDb.findMany(
    h => h.activityId === req.params.activityId
  );
  res.json(history);
});

// Record activity registration
router.post("/register", (req, res) => {
  try {
    const data = historySchema.parse(req.body);
    
    // Check if activity exists
    const activity = activitiesDb.findById(data.activityId);
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    const entry = {
      id: `history_${Date.now()}`,
      ...data,
      registeredAt: new Date().toISOString(),
    };
    
    activityHistoryDb.create(entry);
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ error: "Invalid data" });
  }
});

// Update history entry status (e.g., cancel registration)
router.put("/:id", (req, res) => {
  const entry = activityHistoryDb.findById(req.params.id);
  if (!entry) {
    return res.status(404).json({ error: "History entry not found" });
  }
  
  const updatedEntry = activityHistoryDb.update(req.params.id, req.body);
  res.json(updatedEntry);
});

// Cancel registration
router.post("/:id/cancel", (req, res) => {
  const entry = activityHistoryDb.findById(req.params.id);
  if (!entry) {
    return res.status(404).json({ error: "History entry not found" });
  }
  
  activityHistoryDb.update(req.params.id, {
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
  });
  
  res.json({ success: true });
});

// Mark as attended (after check-in)
router.post("/:id/attend", (req, res) => {
  const entry = activityHistoryDb.findById(req.params.id);
  if (!entry) {
    return res.status(404).json({ error: "History entry not found" });
  }
  
  activityHistoryDb.update(req.params.id, {
    status: "attended",
    attendedAt: new Date().toISOString(),
  });
  
  res.json({ success: true });
});

// Delete history entry
router.delete("/:id", (req, res) => {
  const entry = activityHistoryDb.findById(req.params.id);
  if (!entry) {
    return res.status(404).json({ error: "History entry not found" });
  }
  
  activityHistoryDb.delete(req.params.id);
  res.json({ success: true });
});

export default router;

