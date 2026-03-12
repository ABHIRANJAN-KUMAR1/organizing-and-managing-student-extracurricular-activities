import { Router } from "express";
import { z } from "zod";
import { checkInsDb, activitiesDb } from "../services/database.js";

const router = Router();

// Check-in validation schema
const checkInSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  activityId: z.string(),
  checkedInBy: z.string(),
});

// Get all check-ins
router.get("/", (_req, res) => {
  const checkIns = checkInsDb.findAll();
  res.json(checkIns);
});

// Get check-in by ID
router.get("/:id", (req, res) => {
  const checkIn = checkInsDb.findById(req.params.id);
  if (!checkIn) {
    return res.status(404).json({ error: "Check-in not found" });
  }
  res.json(checkIn);
});

// Get check-ins for an activity
router.get("/activity/:activityId", (req, res) => {
  const checkIns = checkInsDb.findMany(
    c => c.activityId === req.params.activityId
  );
  res.json(checkIns);
});

// Get check-ins by user
router.get("/user/:userId", (req, res) => {
  const checkIns = checkInsDb.findMany(
    c => c.userId === req.params.userId
  );
  res.json(checkIns);
});

// Check in to activity
router.post("/", (req, res) => {
  try {
    const data = checkInSchema.parse(req.body);
    
    // Check if activity exists
    const activity = activitiesDb.findById(data.activityId);
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    // Check if user is registered
    if (!activity.currentParticipants.includes(data.userId)) {
      return res.status(400).json({ error: "User is not registered for this activity" });
    }
    
    // Check if already checked in
    const existingCheckIn = checkInsDb.findMany(
      c => c.activityId === data.activityId && c.userId === data.userId
    );
    if (existingCheckIn.length > 0) {
      return res.status(400).json({ error: "Already checked in" });
    }

    // === TIME WINDOW VALIDATION ===
    const now = new Date();
    const activityDate = new Date(activity.date);
    activityDate.setHours(10, 0, 0, 0); // Default start 10AM
    const activityEnd = new Date(activity.date);
    activityEnd.setHours(18, 0, 0, 0); // Default end 6PM
    
    // Parse start/end times if set
    if (activity.startTime) {
      const [h, m] = activity.startTime.split(':').map(Number);
      activityDate.setHours(h, m, 0, 0);
    }
    if (activity.endTime) {
      const [h, m] = activity.endTime.split(':').map(Number);
      activityEnd.setHours(h, m, 0, 0);
    }
    
    if (now < activityDate || now > activityEnd) {
      return res.status(400).json({ 
        error: "Check-in only allowed during event time window",
        windowStart: activityDate.toISOString(),
        windowEnd: activityEnd.toISOString()
      });
    }
    
    const checkIn = {
      id: `checkin_${Date.now()}`,
      ...data,
      checkedInAt: now.toISOString(),
    };
    
    checkInsDb.create(checkIn);
    
    // Add check-in to activity
    activitiesDb.update(data.activityId, {
      checkIns: [...(activity.checkIns || []), checkIn],
    });
    
    res.status(201).json(checkIn);
  } catch (error) {
    res.status(400).json({ error: "Invalid data" });
  }
});

// Check out from activity
router.post("/:id/checkout", (req, res) => {
  const checkIn = checkInsDb.findById(req.params.id);
  if (!checkIn) {
    return res.status(404).json({ error: "Check-in not found" });
  }
  
  checkInsDb.update(req.params.id, {
    checkedOutAt: new Date().toISOString(),
  });
  
  res.json({ success: true });
});

// Delete check-in
router.delete("/:id", (req, res) => {
  const checkIn = checkInsDb.findById(req.params.id);
  if (!checkIn) {
    return res.status(404).json({ error: "Check-in not found" });
  }
  
  // Remove check-in from activity
  const activity = activitiesDb.findById(checkIn.activityId);
  if (activity) {
    const updatedCheckIns = (activity.checkIns || []).filter(
      (c: any) => c.id !== req.params.id
    );
    activitiesDb.update(checkIn.activityId, { checkIns: updatedCheckIns });
  }
  
  checkInsDb.delete(req.params.id);
  res.json({ success: true });
});

export default router;

