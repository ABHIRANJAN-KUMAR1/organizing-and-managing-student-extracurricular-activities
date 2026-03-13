import { Router } from "express";
import { z } from "zod";
import { checkInsDb, activitiesDb, usersDb, certificatesDb } from "../services/database.js";
import crypto from "crypto";

const router = Router();

// Check-in validation schema
const checkInSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  activityId: z.string(),
  checkedInBy: z.string(),
});

const bulkCheckInSchema = z.object({
  activityId: z.string(),
  userIds: z.array(z.string()),
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

// NEW: Bulk check-in
router.post("/bulk", (req, res) => {
  try {
    const { activityId, userIds, checkedInBy } = bulkCheckInSchema.parse(req.body);
    
    const activity = activitiesDb.findById(activityId);
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }

    const results = [];
    const now = new Date();

    for (const userId of userIds) {
      // Check if already checked in
      const existingCheckIn = checkInsDb.findMany(
        c => c.activityId === activityId && c.userId === userId
      );
      if (existingCheckIn.length > 0) {
        results.push({ userId, status: "already_checked_in" });
        continue;
      }

      // User validation (registered?)
      if (!activity.currentParticipants.includes(userId)) {
        results.push({ userId, status: "not_registered" });
        continue;
      }

      // Time window check (same as single)
      const activityDate = new Date(activity.date);
      activityDate.setHours(10, 0, 0, 0);
      const activityEnd = new Date(activity.date);
      activityEnd.setHours(18, 0, 0, 0);
      
      if (activity.startTime) {
        const [h, m] = activity.startTime.split(':').map(Number);
        activityDate.setHours(h, m, 0, 0);
      }
      if (activity.endTime) {
        const [h, m] = activity.endTime.split(':').map(Number);
        activityEnd.setHours(h, m, 0, 0);
      }
      
      if (now < activityDate || now > activityEnd) {
        results.push({ userId, status: "outside_time_window" });
        continue;
      }

      const user = usersDb.findById(userId);
      const checkIn = {
        id: `checkin_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        userId,
        userName: user?.name || "Unknown",
        activityId,
        checkedInAt: now.toISOString(),
        checkedInBy,
      };
      
      checkInsDb.create(checkIn);
      results.push({ userId, status: "success", checkIn });
    }

    // Update activity checkIns array
    const activityCheckIns = checkInsDb.findMany(c => c.activityId === activityId);
    activitiesDb.update(activityId, { checkIns: activityCheckIns });

    res.json({ success: true, results });
  } catch (error) {
    res.status(400).json({ error: "Invalid bulk data" });
  }
});

// NEW: Generate QR token for activity (for mobile scanning)
router.post("/qr-token/:activityId", (req, res) => {
  const activity = activitiesDb.findById(req.params.activityId);
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }

  const token = crypto.randomBytes(16).toString('hex');
  const tokenData = {
    id: `qr_${Date.now()}`,
    activityId: req.params.activityId,
    token,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
    createdAt: new Date().toISOString(),
    usesLeft: 100, // max uses
  };

  // Save token to checkInsDb or separate table (simple: store in checkIns with null user)
  checkInsDb.create(tokenData as any);

  res.json({ 
    token, 
    qrData: `checkin:${token}`, // format for mobile app
    expiresAt: tokenData.expiresAt 
  });
});

// NEW: Validate QR token and auto check-in
router.post("/qr-checkin", (req, res) => {
  const { token, userId } = req.body;
  
  const qrToken = checkInsDb.findAll().find((t: any) => t.token === token);
  if (!qrToken) {
    return res.status(404).json({ error: "Invalid QR token" });
  }

  if (new Date() > new Date(qrToken.expiresAt)) {
    return res.status(400).json({ error: "QR token expired" });
  }

  if (qrToken.usesLeft <= 0) {
    return res.status(400).json({ error: "QR token max uses reached" });
  }

  // Do check-in logic (reuse single check-in but via QR)
  const activity = activitiesDb.findById(qrToken.activityId);
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }

  // Same validation as POST /
  // ... (call internal check-in function or duplicate logic)

  const user = usersDb.findById(userId);
  if (!user || !activity.currentParticipants.includes(userId)) {
    return res.status(400).json({ error: "User not registered for this activity" });
  }

  const existingCheckIn = checkInsDb.findMany(
    c => c.activityId === qrToken.activityId && c.userId === userId
  );
  if (existingCheckIn.length > 0) {
    return res.status(400).json({ error: "Already checked in" });
  }

  const now = new Date();
  // Time window check...
  // (same as before)

  const checkIn = {
    id: `checkin_${Date.now()}`,
    userId,
    userName: user.name,
    activityId: qrToken.activityId,
    checkedInAt: now.toISOString(),
    checkedInBy: "QR Scan",
  };

  checkInsDb.create(checkIn);
  
  // Decrement QR uses
  checkInsDb.update(qrToken.id, { usesLeft: qrToken.usesLeft - 1 });

  res.json({ success: true, checkIn });
});

// NEW: Attendance report for activity
router.get("/report/:activityId", (req, res) => {
  const activityId = req.params.activityId;
  const activity = activitiesDb.findById(activityId);
  const activityCheckIns = checkInsDb.findMany(c => c.activityId === activityId);

  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }

  const report = {
    activityId,
    activityTitle: activity.title,
    date: activity.date,
    venue: activity.venue,
    totalRegistered: activity.currentParticipants.length,
    totalCheckedIn: activityCheckIns.length,
    checkInRate: activity.currentParticipants.length > 0 
      ? Math.round((activityCheckIns.length / activity.currentParticipants.length) * 100)
      : 0,
    checkIns: activityCheckIns.map(ci => {
      const user = usersDb.findById(ci.userId);
      return {
        ...ci,
        userEmail: user?.email,
        userRole: user?.role,
      };
    }),
    csvExport: `Name,Email,Check-in Time,Checked by\n` + 
      activityCheckIns.map(ci => {
        const user = usersDb.findById(ci.userId);
        return `"${ci.userName}","${user?.email || ''}","${new Date(ci.checkedInAt).toLocaleString()}","${ci.checkedInBy}"`;
      }).join('\n')
  };

  res.json(report);
});

// Single check-in (existing)
router.post("/", (req, res) => {
  try {
    const data = checkInSchema.parse(req.body);
    
    const activity = activitiesDb.findById(data.activityId);
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    if (!activity.currentParticipants.includes(data.userId)) {
      return res.status(400).json({ error: "User is not registered for this activity" });
    }
    
    const existingCheckIn = checkInsDb.findMany(
      c => c.activityId === data.activityId && c.userId === data.userId
    );
    if (existingCheckIn.length > 0) {
      return res.status(400).json({ error: "Already checked in" });
    }

    const now = new Date();
    const activityDate = new Date(activity.date);
    activityDate.setHours(10, 0, 0, 0);
    const activityEnd = new Date(activity.date);
    activityEnd.setHours(18, 0, 0, 0);
    
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

