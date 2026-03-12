import { Router } from "express";
import { z } from "zod";
import { userPreferencesDb } from "../services/database.js";

const router = Router();

// User preferences validation schema
const userPreferencesSchema = z.object({
  userId: z.string(),
  categoryPreferences: z.record(z.number()).optional(),
  timePreference: z.enum(["morning", "afternoon", "evening", "night"]).optional(),
  venuePreferences: z.array(z.string()).optional(),
  activityCountByCategory: z.record(z.number()).optional(),
  totalActivities: z.number().optional(),
  averageRatingGiven: z.number().optional(),
  dayPreference: z.enum(["weekday", "weekend", "any"]).optional(),
});

// Get user preferences
router.get("/:userId", (req, res) => {
  const preferences = userPreferencesDb.findMany(
    p => p.userId === req.params.userId
  );
  
  if (preferences.length === 0) {
    // Return default preferences
    return res.json({
      userId: req.params.userId,
      categoryPreferences: {},
      timePreference: "afternoon",
      venuePreferences: [],
      activityCountByCategory: {},
      totalActivities: 0,
      averageRatingGiven: 0,
      dayPreference: "any",
      updatedAt: new Date().toISOString(),
    });
  }
  
  res.json(preferences[0]);
});

// Update user preferences
router.put("/:userId", (req, res) => {
  try {
    const data = userPreferencesSchema.parse(req.body);
    
    // Check if preferences exist
    const existing = userPreferencesDb.findMany(
      p => p.userId === req.params.userId
    );
    
    if (existing.length > 0) {
      // Update existing
      const updated = userPreferencesDb.update(existing[0].id, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      return res.json(updated);
    } else {
      // Create new
      const newPreferences = {
        id: `prefs_${Date.now()}`,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      userPreferencesDb.create(newPreferences);
      return res.json(newPreferences);
    }
  } catch (error) {
    res.status(400).json({ error: "Invalid data" });
  }
});

// Update preferences based on activity registration
router.post("/:userId/update-from-activity", (req, res) => {
  const { activityCategory, activityVenue, activityStartTime, activityDate, rating } = req.body;
  
  try {
    const existing = userPreferencesDb.findMany(
      p => p.userId === req.params.userId
    );
    
    let prefs = existing.length > 0 ? existing[0] : {
      id: `prefs_${Date.now()}`,
      userId: req.params.userId,
      categoryPreferences: {},
      timePreference: "afternoon",
      venuePreferences: [],
      activityCountByCategory: {},
      totalActivities: 0,
      averageRatingGiven: 0,
      dayPreference: "any",
      updatedAt: new Date().toISOString(),
    };
    
    // Update category preferences
    if (activityCategory) {
      const currentScore = prefs.categoryPreferences[activityCategory] || 0;
      prefs.categoryPreferences[activityCategory] = currentScore + 10;
      
      // Update activity count
      const currentCount = prefs.activityCountByCategory[activityCategory] || 0;
      prefs.activityCountByCategory[activityCategory] = currentCount + 1;
    }
    
    // Update total activities
    prefs.totalActivities = (prefs.totalActivities || 0) + 1;
    
    // Update time preference
    if (activityStartTime && prefs.timePreference === "afternoon") {
      const hour = parseInt(activityStartTime.split(":")[0]);
      if (hour >= 6 && hour < 12) prefs.timePreference = "morning";
      else if (hour >= 12 && hour < 17) prefs.timePreference = "afternoon";
      else if (hour >= 17 && hour < 21) prefs.timePreference = "evening";
      else prefs.timePreference = "night";
    }
    
    // Update venue preferences
    if (activityVenue && prefs.venuePreferences) {
      if (!prefs.venuePreferences.includes(activityVenue)) {
        prefs.venuePreferences.push(activityVenue);
        if (prefs.venuePreferences.length > 5) {
          prefs.venuePreferences.shift();
        }
      }
    }
    
    // Update day preference
    if (activityDate && prefs.dayPreference === "any") {
      const d = new Date(activityDate);
      const day = d.getDay();
      prefs.dayPreference = day === 0 || day === 6 ? "weekend" : "weekday";
    }
    
    // Update average rating
    if (rating !== undefined && prefs.totalActivities > 0) {
      const totalRatings = prefs.totalActivities;
      prefs.averageRatingGiven = ((prefs.averageRatingGiven * (totalRatings - 1)) + rating) / totalRatings;
    }
    
    prefs.updatedAt = new Date().toISOString();
    
    if (existing.length > 0) {
      userPreferencesDb.update(existing[0].id, prefs);
    } else {
      userPreferencesDb.create(prefs);
    }
    
    res.json(prefs);
  } catch (error) {
    res.status(400).json({ error: "Invalid data" });
  }
});

export default router;

