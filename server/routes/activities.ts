import { Router } from "express";
import { z } from "zod";
import { activitiesDb, categoriesDb } from "../services/database.js";

const router = Router();

// Activity validation schema
const activitySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string(),
  date: z.string(),
  venue: z.string(),
  maxParticipants: z.number().positive(),
  tags: z.array(z.string()).optional(),
  requiresApproval: z.boolean().optional(),
});

// Get all activities
router.get("/", (_req, res) => {
  const activities = activitiesDb.findAll();
  res.json(activities);
});

// Get activity by ID
router.get("/:id", (req, res) => {
  const activity = activitiesDb.findById(req.params.id);
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  res.json(activity);
});

// Create activity (admin only)
router.post("/", (req, res) => {
  try {
    const data = activitySchema.parse(req.body);
    const activity = {
      id: `activity_${Date.now()}`,
      ...data,
      currentParticipants: [],
      waitlist: [],
      comments: [],
      ratings: [],
      createdBy: "admin",
      createdAt: new Date().toISOString(),
      photos: [],
      approvedParticipants: [],
      pendingParticipants: [],
      rejectedParticipants: [],
      checkIns: [],
      feedbacks: [],
    };
    activitiesDb.create(activity);
    res.status(201).json(activity);
  } catch (error) {
    res.status(400).json({ error: "Invalid data" });
  }
});

// Update activity
router.put("/:id", (req, res) => {
  const activity = activitiesDb.findById(req.params.id);
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  const updated = activitiesDb.update(req.params.id, req.body);
  res.json(updated);
});

// Delete activity
router.delete("/:id", (req, res) => {
  const activity = activitiesDb.findById(req.params.id);
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  activitiesDb.delete(req.params.id);
  res.json({ success: true });
});

// Register for activity
router.post("/:id/register", (req, res) => {
  const { userId } = req.body;
  const activity = activitiesDb.findById(req.params.id);
  
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  
  if (activity.currentParticipants.includes(userId)) {
    return res.status(400).json({ error: "Already registered" });
  }
  
  if (activity.currentParticipants.length >= activity.maxParticipants) {
    return res.status(400).json({ error: "Activity is full" });
  }
  
  const updated = activitiesDb.update(req.params.id, {
    currentParticipants: [...activity.currentParticipants, userId],
  });
  res.json(updated);
});

// Unregister from activity
router.post("/:id/unregister", (req, res) => {
  const { userId } = req.body;
  const activity = activitiesDb.findById(req.params.id);
  
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  
  const updated = activitiesDb.update(req.params.id, {
    currentParticipants: activity.currentParticipants.filter((id: string) => id !== userId),
  });
  res.json(updated);
});

// Join waitlist
router.post("/:id/waitlist", (req, res) => {
  const { userId } = req.body;
  const activity = activitiesDb.findById(req.params.id);
  
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  
  if (activity.waitlist.includes(userId)) {
    return res.status(400).json({ error: "Already on waitlist" });
  }
  
  const updated = activitiesDb.update(req.params.id, {
    waitlist: [...activity.waitlist, userId],
  });
  res.json(updated);
});

// Leave waitlist
router.post("/:id/leave-waitlist", (req, res) => {
  const { userId } = req.body;
  const activity = activitiesDb.findById(req.params.id);
  
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  
  const updated = activitiesDb.update(req.params.id, {
    waitlist: activity.waitlist.filter((id: string) => id !== userId),
  });
  res.json(updated);
});

// Add comment
router.post("/:id/comments", (req, res) => {
  const { userId, userName, content } = req.body;
  const activity = activitiesDb.findById(req.params.id);
  
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  
  const comment = {
    id: `comment_${Date.now()}`,
    userId,
    userName,
    content,
    createdAt: new Date().toISOString(),
  };
  
  const updated = activitiesDb.update(req.params.id, {
    comments: [...(activity.comments || []), comment],
  });
  res.json(comment);
});

// Delete comment
router.delete("/:id/comments/:commentId", (req, res) => {
  const activity = activitiesDb.findById(req.params.id);
  
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  
  const updated = activitiesDb.update(req.params.id, {
    comments: (activity.comments || []).filter((c: any) => c.id !== req.params.commentId),
  });
  res.json({ success: true });
});

// Add rating
router.post("/:id/ratings", (req, res) => {
  const { userId, userName, score, review } = req.body;
  const activity = activitiesDb.findById(req.params.id);
  
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  
  const rating = {
    id: `rating_${Date.now()}`,
    userId,
    userName,
    score,
    review,
    createdAt: new Date().toISOString(),
  };
  
  activitiesDb.update(req.params.id, {
    ratings: [...(activity.ratings || []), rating],
  });
  res.json(rating);
});

// Add photo (admin)
router.post("/:id/photos", (req, res) => {
  const { url, caption, uploadedBy } = req.body;
  const activity = activitiesDb.findById(req.params.id);
  
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  
  const photo = {
    id: `photo_${Date.now()}`,
    activityId: activity.id,
    url,
    caption,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
  };
  
  activitiesDb.update(req.params.id, {
    photos: [...(activity.photos || []), photo],
  });
  res.json(photo);
});

// Get categories
router.get("/categories", (_req, res) => {
  const categories = categoriesDb.findAll();
  res.json(categories);
});

// Add category
router.post("/categories", (req, res) => {
  const { name } = req.body;
  
  // Check if category already exists
  const existing = categoriesDb.findAll().find(c => c.name === name);
  if (existing) {
    return res.status(400).json({ error: "Category already exists" });
  }
  
  const category = {
    id: `cat_${Date.now()}`,
    name,
    createdAt: new Date().toISOString(),
  };
  categoriesDb.create(category);
  res.status(201).json(category);
});

// Update category
router.put("/categories/:id", (req, res) => {
  const category = categoriesDb.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ error: "Category not found" });
  }
  const updated = categoriesDb.update(req.params.id, req.body);
  res.json(updated);
});

// Delete category
router.delete("/categories/:id", (req, res) => {
  const category = categoriesDb.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ error: "Category not found" });
  }
  categoriesDb.delete(req.params.id);
  res.json({ success: true });
});

export default router;
