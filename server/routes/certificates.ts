import { Router } from "express";
import { z } from "zod";
import { certificatesDb, activitiesDb, usersDb } from "../services/database.js";

const router = Router();

// Certificate validation schema
const certificateSchema = z.object({
  activityId: z.string(),
  userId: z.string(),
});

// Get all certificates
router.get("/", (_req, res) => {
  const certificates = certificatesDb.findAll();
  res.json(certificates);
});

// Get certificate by ID
router.get("/:id", (req, res) => {
  const certificate = certificatesDb.findById(req.params.id);
  if (!certificate) {
    return res.status(404).json({ error: "Certificate not found" });
  }
  res.json(certificate);
});

// Get certificates for a user
router.get("/user/:userId", (req, res) => {
  const certificates = certificatesDb.findMany(
    c => c.userId === req.params.userId
  );
  res.json(certificates);
});

// Get certificates for an activity
router.get("/activity/:activityId", (req, res) => {
  const certificates = certificatesDb.findMany(
    c => c.activityId === req.params.activityId
  );
  res.json(certificates);
});

// Issue certificate (after activity is completed)
router.post("/", (req, res) => {
  try {
    const data = certificateSchema.parse(req.body);
    
    // Check if activity exists
    const activity = activitiesDb.findById(data.activityId);
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    // Check if user exists
    const user = usersDb.findById(data.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check if user participated in the activity
    if (!activity.currentParticipants.includes(data.userId)) {
      return res.status(400).json({ error: "User did not participate in this activity" });
    }
    
    // Check if certificate already exists
    const existing = certificatesDb.findMany(
      c => c.activityId === data.activityId && c.userId === data.userId
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Certificate already issued" });
    }
    
    const certificate = {
      id: `cert_${Date.now()}`,
      activityId: data.activityId,
      activityTitle: activity.title,
      userId: data.userId,
      userName: user.name,
      issueDate: new Date().toISOString(),
      activityDate: activity.date,
    };
    
    certificatesDb.create(certificate);
    res.status(201).json(certificate);
  } catch (error) {
    res.status(400).json({ error: "Invalid data" });
  }
});

// Verify certificate
router.get("/verify/:id", (req, res) => {
  const certificate = certificatesDb.findById(req.params.id);
  if (!certificate) {
    return res.status(404).json({ error: "Certificate not found", valid: false });
  }
  res.json({ ...certificate, valid: true });
});

export default router;

