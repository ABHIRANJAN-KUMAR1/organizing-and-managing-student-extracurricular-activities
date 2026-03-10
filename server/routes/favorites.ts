import { Router } from "express";
import { favoritesDb, activitiesDb } from "../services/database.js";

const router = Router();

// Get favorites for a user
router.get("/user/:userId", (req, res) => {
  const favorites = favoritesDb.findMany(
    f => f.userId === req.params.userId
  );
  
  // Also get the activity details
  const favoriteActivities = favorites.map(fav => {
    const activity = activitiesDb.findById(fav.activityId);
    return activity ? { ...activity, favoriteId: fav.id, addedAt: fav.addedAt } : null;
  }).filter(Boolean);
  
  res.json(favoriteActivities);
});

// Check if activity is favorite
router.get("/:userId/:activityId", (req, res) => {
  const favorite = favoritesDb.findMany(
    f => f.userId === req.params.userId && f.activityId === req.params.activityId
  );
  
  res.json({ isFavorite: favorite.length > 0 });
});

// Add to favorites
router.post("/", (req, res) => {
  const { userId, activityId } = req.body;
  
  if (!userId || !activityId) {
    return res.status(400).json({ error: "userId and activityId are required" });
  }
  
  // Check if already favorited
  const existing = favoritesDb.findMany(
    f => f.userId === userId && f.activityId === activityId
  );
  
  if (existing.length > 0) {
    return res.status(400).json({ error: "Already in favorites" });
  }
  
  // Check if activity exists
  const activity = activitiesDb.findById(activityId);
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  
  const favorite = {
    id: `fav_${Date.now()}`,
    userId,
    activityId,
    addedAt: new Date().toISOString(),
  };
  
  favoritesDb.create(favorite);
  res.status(201).json(favorite);
});

// Remove from favorites
router.delete("/:id", (req, res) => {
  const favorite = favoritesDb.findById(req.params.id);
  if (!favorite) {
    return res.status(404).json({ error: "Favorite not found" });
  }
  
  favoritesDb.delete(req.params.id);
  res.json({ success: true });
});

// Remove favorite by user and activity
router.delete("/user/:userId/activity/:activityId", (req, res) => {
  const favorites = favoritesDb.findMany(
    f => f.userId === req.params.userId && f.activityId === req.params.activityId
  );
  
  if (favorites.length === 0) {
    return res.status(404).json({ error: "Favorite not found" });
  }
  
  favorites.forEach(f => favoritesDb.delete(f.id));
  res.json({ success: true });
});

export default router;

