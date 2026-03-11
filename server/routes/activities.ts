import { Router } from "express";
import { z } from "zod";
import { activitiesDb, categoriesDb, usersDb, notificationsDb, remindersDb } from "../services/database.js";

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
  reminderHours: z.number().optional(),
});

// Get all activities with search and filter
router.get("/", (req, res) => {
  let activities = activitiesDb.findAll();
  
  // Search functionality
  const search = req.query.search as string;
  if (search) {
    const searchLower = search.toLowerCase();
    activities = activities.filter(a => 
      a.title.toLowerCase().includes(searchLower) ||
      a.description.toLowerCase().includes(searchLower) ||
      a.venue.toLowerCase().includes(searchLower) ||
      a.category.toLowerCase().includes(searchLower)
    );
  }
  
  // Filter by category
  const category = req.query.category as string;
  if (category && category !== "all") {
    activities = activities.filter(a => a.category === category);
  }
  
  // Filter by date range
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  if (startDate) {
    activities = activities.filter(a => new Date(a.date) >= new Date(startDate));
  }
  if (endDate) {
    activities = activities.filter(a => new Date(a.date) <= new Date(endDate));
  }
  
  // Filter by status
  const status = req.query.status as string;
  const now = new Date();
  if (status === "upcoming") {
    activities = activities.filter(a => new Date(a.date) > now);
  } else if (status === "completed") {
    activities = activities.filter(a => new Date(a.date) < now);
  } else if (status === "open") {
    activities = activities.filter(a => new Date(a.date) > now && a.currentParticipants.length < a.maxParticipants);
  } else if (status === "full") {
    activities = activities.filter(a => a.currentParticipants.length >= a.maxParticipants);
  }
  
  // Sort by
  const sortBy = req.query.sortBy as string;
  if (sortBy === "date") {
    activities.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else if (sortBy === "registrations") {
    activities.sort((a, b) => b.currentParticipants.length - a.currentParticipants.length);
  } else if (sortBy === "title") {
    activities.sort((a, b) => a.title.localeCompare(b.title));
  }
  
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

// Get activity statistics
router.get("/:id/stats", (req, res) => {
  const activity = activitiesDb.findById(req.params.id);
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  
  const stats = {
    totalParticipants: activity.currentParticipants.length,
    maxParticipants: activity.maxParticipants,
    availableSlots: activity.maxParticipants - activity.currentParticipants.length,
    waitlistCount: activity.waitlist?.length || 0,
    commentsCount: activity.comments?.length || 0,
    ratingsCount: activity.ratings?.length || 0,
    checkInsCount: activity.checkIns?.length || 0,
    avgRating: activity.ratings?.length 
      ? (activity.ratings.reduce((sum, r) => sum + r.score, 0) / activity.ratings.length).toFixed(1)
      : 0,
    fillRate: Math.round((activity.currentParticipants.length / activity.maxParticipants) * 100),
    isFull: activity.currentParticipants.length >= activity.maxParticipants,
    isUpcoming: new Date(activity.date) > new Date(),
  };
  
  res.json(stats);
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

// ========== APPROVAL SYSTEM ==========

// Request registration (for activities requiring approval)
router.post("/:id/request-registration", (req, res) => {
  const { userId, userName, email } = req.body;
  const activity = activitiesDb.findById(req.params.id);
  
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  
  if (!activity.requiresApproval) {
    return res.status(400).json({ error: "This activity does not require approval" });
  }
  
  if (activity.currentParticipants.includes(userId)) {
    return res.status(400).json({ error: "Already registered" });
  }
  
  if (activity.pendingParticipants?.includes(userId)) {
    return res.status(400).json({ error: "Already pending approval" });
  }
  
  const pendingParticipants = activity.pendingParticipants || [];
  activitiesDb.update(req.params.id, {
    pendingParticipants: [...pendingParticipants, userId]
  });
  
  // Create notification for admin
  notificationsDb.create({
    id: `notif_${Date.now()}`,
    title: "Registration Request",
    message: `${userName} requested to register for "${activity.title}"`,
    type: "info",
    read: false,
    createdAt: new Date().toISOString(),
    targetRole: "admin"
  });
  
  res.json({ success: true, message: "Registration request submitted" });
});

// Approve registration
router.post("/:id/approve/:userId", (req, res) => {
  const activity = activitiesDb.findById(req.params.id);
  const { userName, email } = req.body;
  
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  
  const pending = activity.pendingParticipants || [];
  if (!pending.includes(req.params.userId)) {
    return res.status(400).json({ error: "No pending request found" });
  }
  
  if (activity.currentParticipants.length >= activity.maxParticipants) {
    return res.status(400).json({ error: "Activity is full" });
  }
  
  activitiesDb.update(req.params.id, {
    currentParticipants: [...activity.currentParticipants, req.params.userId],
    pendingParticipants: pending.filter((id: string) => id !== req.params.userId),
    approvedParticipants: [...(activity.approvedParticipants || []), req.params.userId]
  });
  
  // Notify user
  notificationsDb.create({
    id: `notif_${Date.now()}`,
    userId: req.params.userId,
    title: "Registration Approved",
    message: `Your registration for "${activity.title}" has been approved!`,
    type: "success",
    read: false,
    createdAt: new Date().toISOString()
  });
  
  res.json({ success: true, message: "Registration approved" });
});

// Reject registration
router.post("/:id/reject/:userId", (req, res) => {
  const activity = activitiesDb.findById(req.params.id);
  const { reason } = req.body;
  
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  
  const pending = activity.pendingParticipants || [];
  activitiesDb.update(req.params.id, {
    pendingParticipants: pending.filter((id: string) => id !== req.params.userId),
    rejectedParticipants: [...(activity.rejectedParticipants || []), req.params.userId]
  });
  
  // Notify user
  notificationsDb.create({
    id: `notif_${Date.now()}`,
    userId: req.params.userId,
    title: "Registration Rejected",
    message: `Your registration for "${activity.title}" was rejected. ${reason ? `Reason: ${reason}` : ""}`,
    type: "error",
    read: false,
    createdAt: new Date().toISOString()
  });
  
  res.json({ success: true, message: "Registration rejected" });
});

// Get pending approvals (admin)
router.get("/pending-approvals", (_req, res) => {
  const activities = activitiesDb.findAll();
  const pendingApprovals: any[] = [];
  
  activities.forEach(activity => {
    if (activity.requiresApproval && activity.pendingParticipants?.length > 0) {
      activity.pendingParticipants.forEach((userId: string) => {
        const user = usersDb.findById(userId);
        pendingApprovals.push({
          activityId: activity.id,
          activityTitle: activity.title,
          userId,
          userName: user?.name || "Unknown",
          userEmail: user?.email || "",
          requestedAt: activity.createdAt
        });
      });
    }
  });
  
  res.json(pendingApprovals);
});

// ========== REMINDERS ==========

// Create reminder for activity
router.post("/:id/reminder", (req, res) => {
  const { userId, hoursBefore } = req.body;
  const activity = activitiesDb.findById(req.params.id);
  
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  
  const activityDate = new Date(activity.date);
  const reminderTime = new Date(activityDate.getTime() - (hoursBefore * 60 * 60 * 1000));
  
  const reminder = {
    id: `reminder_${Date.now()}`,
    activityId: req.params.id,
    userId,
    reminderTime: reminderTime.toISOString(),
    sent: false,
    createdAt: new Date().toISOString()
  };
  
  remindersDb.create(reminder);
  res.json(reminder);
});

// Get reminders for user
router.get("/reminders/:userId", (req, res) => {
  const reminders = remindersDb.findMany(r => r.userId === req.params.userId);
  const activities = activitiesDb.findAll();
  
  const remindersWithActivity = reminders.map(reminder => {
    const activity = activities.find(a => a.id === reminder.activityId);
    return {
      ...reminder,
      activityTitle: activity?.title,
      activityDate: activity?.date,
      activityVenue: activity?.venue
    };
  });
  
  res.json(remindersWithActivity);
});

// Send reminder to all participants
router.post("/:id/send-reminder", (req, res) => {
  const activity = activitiesDb.findById(req.params.id);
  
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  
  const { message } = req.body;
  const participants = activity.currentParticipants || [];
  
  participants.forEach(userId => {
    notificationsDb.create({
      id: `notif_${Date.now()}_${userId}`,
      userId,
      title: "Activity Reminder",
      message: message || `Reminder: ${activity.title} is coming up on ${activity.date} at ${activity.venue}`,
      type: "info",
      read: false,
      createdAt: new Date().toISOString()
    });
  });
  
  res.json({ success: true, sentCount: participants.length });
});

// ========== AUTO REMINDERS (called by scheduler) ==========

// Get due reminders
router.get("/reminders/due", (_req, res) => {
  const now = new Date();
  const reminders = remindersDb.findAll();
  
  const dueReminders = reminders.filter(r => {
    return !r.sent && new Date(r.reminderTime) <= now;
  });
  
  res.json(dueReminders);
});

// Mark reminder as sent
router.put("/reminders/:id/mark-sent", (req, res) => {
  remindersDb.update(req.params.id, { sent: true });
  res.json({ success: true });
});

export default router;
