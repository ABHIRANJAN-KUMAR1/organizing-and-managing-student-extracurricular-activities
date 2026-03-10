import { Router } from "express";
import { z } from "zod";
import { feedbacksDb, activitiesDb } from "../services/database.js";

const router = Router();

// Feedback validation schema
const feedbackSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  activityId: z.string(),
  overallRating: z.number().min(1).max(5),
  organizationRating: z.number().min(1).max(5),
  contentRating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// Get all feedbacks
router.get("/", (_req, res) => {
  const feedbacks = feedbacksDb.findAll();
  res.json(feedbacks);
});

// Get feedback by ID
router.get("/:id", (req, res) => {
  const feedback = feedbacksDb.findById(req.params.id);
  if (!feedback) {
    return res.status(404).json({ error: "Feedback not found" });
  }
  res.json(feedback);
});

// Get feedbacks for an activity
router.get("/activity/:activityId", (req, res) => {
  const feedbacks = feedbacksDb.findMany(
    f => f.activityId === req.params.activityId
  );
  res.json(feedbacks);
});

// Get feedbacks by user
router.get("/user/:userId", (req, res) => {
  const feedbacks = feedbacksDb.findMany(
    f => f.userId === req.params.userId
  );
  res.json(feedbacks);
});

// Create feedback
router.post("/", (req, res) => {
  try {
    const data = feedbackSchema.parse(req.body);
    
    // Check if activity exists
    const activity = activitiesDb.findById(data.activityId);
    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }
    
    // Check if user already submitted feedback for this activity
    const existingFeedback = feedbacksDb.findMany(
      f => f.activityId === data.activityId && f.userId === data.userId
    );
    if (existingFeedback.length > 0) {
      return res.status(400).json({ error: "You have already submitted feedback for this activity" });
    }
    
    const feedback = {
      id: `feedback_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    
    feedbacksDb.create(feedback);
    
    // Add feedback to activity
    activitiesDb.update(data.activityId, {
      feedbacks: [...(activity.feedbacks || []), feedback],
    });
    
    res.status(201).json(feedback);
  } catch (error) {
    res.status(400).json({ error: "Invalid data" });
  }
});

// Delete feedback
router.delete("/:id", (req, res) => {
  const feedback = feedbacksDb.findById(req.params.id);
  if (!feedback) {
    return res.status(404).json({ error: "Feedback not found" });
  }
  
  // Remove feedback from activity
  const activity = activitiesDb.findById(feedback.activityId);
  if (activity) {
    const updatedFeedbacks = (activity.feedbacks || []).filter(
      (f: any) => f.id !== req.params.id
    );
    activitiesDb.update(feedback.activityId, { feedbacks: updatedFeedbacks });
  }
  
  feedbacksDb.delete(req.params.id);
  res.json({ success: true });
});

export default router;

