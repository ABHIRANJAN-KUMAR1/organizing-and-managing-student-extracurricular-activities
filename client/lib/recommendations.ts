import { Activity, UserPreferenceProfile, RecommendedActivity, RecommendationReason } from "@/types";

const PREFERENCES_KEY = "user_preferences";

// Cache for preferences - will sync with server
let preferencesCache: Map<string, UserPreferenceProfile> = new Map();
let isInitialized: Map<string, boolean> = new Map();

function getTimeOfDay(startTime?: string): "morning" | "afternoon" | "evening" | "night" {
  if (!startTime) return "afternoon";
  const hour = parseInt(startTime.split(":")[0]);
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function getDayType(date: string): "weekday" | "weekend" {
  const d = new Date(date);
  const day = d.getDay();
  return day === 0 || day === 6 ? "weekend" : "weekday";
}

// Default preferences
function getDefaultPreferences(userId: string): UserPreferenceProfile {
  return {
    userId: userId,
    categoryPreferences: {},
    timePreference: "afternoon",
    venuePreferences: [],
    activityCountByCategory: {},
    totalActivities: 0,
    averageRatingGiven: 0,
    dayPreference: "any",
    updatedAt: new Date().toISOString(),
  };
}

// Fetch preferences from server
async function fetchFromServer(userId: string): Promise<UserPreferenceProfile> {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/user-preferences/${userId}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      preferencesCache.set(userId, data);
      return data;
    }
  } catch (error) {
    console.error("Failed to fetch preferences from server:", error);
  }
  
  // Fallback to localStorage
  const stored = localStorage.getItem(PREFERENCES_KEY + "_" + userId);
  if (stored) {
    const prefs = JSON.parse(stored);
    preferencesCache.set(userId, prefs);
    return prefs;
  }
  
  const defaults = getDefaultPreferences(userId);
  preferencesCache.set(userId, defaults);
  return defaults;
}

// Save preferences to server
async function saveToServer(prefs: UserPreferenceProfile): Promise<void> {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/user-preferences/${prefs.userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(prefs),
    });
    
    if (response.ok) {
      console.log("Preferences saved to server");
    }
  } catch (error) {
    console.error("Failed to save preferences to server:", error);
  }
  
  // Always save to localStorage as backup
  localStorage.setItem(PREFERENCES_KEY + "_" + prefs.userId, JSON.stringify(prefs));
}

// Update preferences on server from activity
async function updatePreferencesOnServer(userId: string, activityData: {
  activityCategory?: string;
  activityVenue?: string;
  activityStartTime?: string;
  activityDate?: string;
  rating?: number;
}): Promise<void> {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/user-preferences/${userId}/update-from-activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(activityData),
    });
    
    if (response.ok) {
      const updatedPrefs = await response.json();
      preferencesCache.set(userId, updatedPrefs);
      localStorage.setItem(PREFERENCES_KEY + "_" + userId, JSON.stringify(updatedPrefs));
    }
  } catch (error) {
    console.error("Failed to update preferences on server:", error);
  }
}

export async function getUserPreferences(userId: string): Promise<UserPreferenceProfile> {
  // If already initialized, return cached
  if (isInitialized.get(userId) && preferencesCache.has(userId)) {
    return preferencesCache.get(userId)!;
  }
  
  // Fetch from server
  const prefs = await fetchFromServer(userId);
  isInitialized.set(userId, true);
  return prefs;
}

// Synchronous version - returns default if not cached
export function getUserPreferencesSync(userId: string): UserPreferenceProfile {
  if (preferencesCache.has(userId)) {
    return preferencesCache.get(userId)!;
  }
  
  // Try localStorage as fallback
  const stored = localStorage.getItem(PREFERENCES_KEY + "_" + userId);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Ignore parse errors
    }
  }
  
  return getDefaultPreferences(userId);
}

export async function saveUserPreferences(prefs: UserPreferenceProfile): Promise<void> {
  prefs.updatedAt = new Date().toISOString();
  preferencesCache.set(prefs.userId, prefs);
  await saveToServer(prefs);
}

export async function updatePreferencesFromActivity(
  userId: string,
  activity: Activity,
  rating?: number
): Promise<UserPreferenceProfile> {
  // Try to update via server API first
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/user-preferences/${userId}/update-from-activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        activityCategory: activity.category,
        activityVenue: activity.venue,
        activityStartTime: activity.startTime,
        activityDate: activity.date,
        rating: rating,
      }),
    });
    
    if (response.ok) {
      const updatedPrefs = await response.json();
      preferencesCache.set(userId, updatedPrefs);
      localStorage.setItem(PREFERENCES_KEY + "_" + userId, JSON.stringify(updatedPrefs));
      return updatedPrefs;
    }
  } catch (error) {
    console.error("Failed to update preferences on server:", error);
  }
  
  // Fallback to local calculation
  const prefs = await getUserPreferences(userId);
  
  const currentCatScore = prefs.categoryPreferences[activity.category] || 0;
  prefs.categoryPreferences[activity.category] = currentCatScore + 10;
  
  const currentCount = prefs.activityCountByCategory[activity.category] || 0;
  prefs.activityCountByCategory[activity.category] = currentCount + 1;
  
  prefs.totalActivities += 1;
  
  const timeOfDayVal = getTimeOfDay(activity.startTime);
  if (prefs.timePreference === "afternoon") {
    prefs.timePreference = timeOfDayVal;
  }
  
  if (!prefs.venuePreferences.includes(activity.venue)) {
    prefs.venuePreferences.push(activity.venue);
    if (prefs.venuePreferences.length > 5) {
      prefs.venuePreferences.shift();
    }
  }
  
  const dayTypeVal = getDayType(activity.date);
  if (prefs.dayPreference === "any") {
    prefs.dayPreference = dayTypeVal;
  }
  
  if (rating !== undefined && prefs.totalActivities > 0) {
    const totalRatings = prefs.totalActivities;
    prefs.averageRatingGiven = ((prefs.averageRatingGiven * (totalRatings - 1)) + rating) / totalRatings;
  }
  
  await saveUserPreferences(prefs);
  return prefs;
}

function calculateActivityScore(
  activity: Activity,
  prefs: UserPreferenceProfile,
  _allActivities: Activity[]
): { score: number; reasons: RecommendationReason[] } {
  let score = 0;
  const reasons: RecommendationReason[] = [];
  
  const categoryScore = prefs.categoryPreferences[activity.category] || 0;
  if (categoryScore > 0) {
    const normalizedScore = Math.min(categoryScore, 40);
    score += normalizedScore;
    reasons.push({
      type: "category_match",
      message: "Matches your interest in " + activity.category,
      score: normalizedScore,
    });
  }
  
  const activityTime = getTimeOfDay(activity.startTime);
  if (prefs.timePreference === activityTime) {
    score += 20;
    reasons.push({
      type: "time_match",
      message: "Scheduled during your preferred time (" + activityTime + ")",
      score: 20,
    });
  }
  
  const popularityScore = Math.min(activity.currentParticipants.length * 4, 20);
  if (popularityScore > 0) {
    score += popularityScore;
    reasons.push({
      type: "popular",
      message: activity.currentParticipants.length + " students have joined",
      score: popularityScore,
    });
  }
  
  if (activity.ratings && activity.ratings.length > 0) {
    const avgRating = activity.ratings.reduce((sum, r) => sum + r.score, 0) / activity.ratings.length;
    const ratingScore = Math.round(avgRating * 3);
    if (ratingScore > 0) {
      score += ratingScore;
      reasons.push({
        type: "high_rated",
        message: "Rated " + avgRating.toFixed(1) + " stars by participants",
        score: ratingScore,
      });
    }
  }
  
  const activityDate = new Date(activity.date);
  const now = new Date();
  const daysUntil = Math.ceil((activityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntil > 0 && daysUntil <= 7) {
    const newScore = Math.max(10 - daysUntil, 5);
    score += newScore;
    reasons.push({
      type: "new_activity",
      message: "Coming up in " + daysUntil + " day" + (daysUntil > 1 ? "s" : ""),
      score: newScore,
    });
  }
  
  if (prefs.activityCountByCategory[activity.category] >= 3) {
    score += 15;
    reasons.push({
      type: "similar_joined",
      message: "Similar to activities you've enjoyed before",
      score: 15,
    });
  }
  
  if (prefs.venuePreferences.includes(activity.venue)) {
    score += 10;
    reasons.push({
      type: "category_match",
      message: "At your preferred venue: " + activity.venue,
      score: 10,
    });
  }
  
  return { score: score, reasons: reasons };
}

export function getRecommendations(
  userId: string,
  allActivities: Activity[],
  limit: number = 6
): RecommendedActivity[] {
  const prefs = getUserPreferencesSync(userId);
  
  const availableActivities = allActivities.filter(
    (a) => !a.currentParticipants.includes(userId)
  );
  
  if (prefs.totalActivities === 0) {
    return availableActivities
      .sort((a, b) => {
        const aDate = new Date(a.date).getTime();
        const bDate = new Date(b.date).getTime();
        const now = Date.now();
        const aDays = Math.ceil((aDate - now) / (1000 * 60 * 60 * 24));
        const bDays = Math.ceil((bDate - now) / (1000 * 60 * 60 * 24));
        const aScore = a.currentParticipants.length + Math.max(0, 7 - aDays);
        const bScore = b.currentParticipants.length + Math.max(0, 7 - bDays);
        return bScore - aScore;
      })
      .slice(0, limit)
      .map((activity) => ({
        activity: activity,
        score: 50,
        reasons: [{
          type: "new_activity",
          message: "Popular new activity",
          score: 50,
        }],
      }));
  }
  
  const scoredActivities = availableActivities.map((activity) => {
    const result = calculateActivityScore(activity, prefs, allActivities);
    return { activity: activity, score: result.score, reasons: result.reasons };
  });
  
  scoredActivities.sort((a, b) => b.score - a.score);
  
  return scoredActivities.slice(0, limit);
}

export function getSimilarUserRecommendations(
  userId: string,
  allActivities: Activity[],
  limit: number = 4
): RecommendedActivity[] {
  const prefs = getUserPreferencesSync(userId);
  
  const topCategories = Object.entries(prefs.categoryPreferences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map((entry) => entry[0]);
  
  if (topCategories.length === 0) return [];
  
  const similarActivities = allActivities
    .filter(
      (a) =>
        !a.currentParticipants.includes(userId) &&
        topCategories.includes(a.category) &&
        a.currentParticipants.length > 0
    )
    .slice(0, limit);
  
  return similarActivities.map((activity) => ({
    activity: activity,
    score: 60,
    reasons: [{
      type: "similar_joined",
      message: "Students with similar interests joined this",
      score: 60,
    }],
  }));
}

export function getCategorySuggestions(
  userId: string,
  allActivities: Activity[],
  category: string,
  limit: number = 4
): RecommendedActivity[] {
  const prefs = getUserPreferencesSync(userId);
  
  const categoryActivities = allActivities
    .filter(
      (a) =>
        !a.currentParticipants.includes(userId) &&
        a.category === category
    )
    .sort((a, b) => b.currentParticipants.length - a.currentParticipants.length)
    .slice(0, limit);
  
  return categoryActivities.map((activity) => ({
    activity: activity,
    score: prefs.categoryPreferences[category] || 30,
    reasons: [{
      type: "category_match",
      message: "Popular in " + category,
      score: prefs.categoryPreferences[category] || 30,
    }],
  }));
}

export function refreshRecommendations(userId: string): void {
  localStorage.removeItem(PREFERENCES_KEY + "_" + userId);
}

