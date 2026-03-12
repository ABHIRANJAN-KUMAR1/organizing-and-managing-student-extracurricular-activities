import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Activity, ActivityContextType, Category, Comment, Rating, ActivityHistoryEntry } from "@/types";
import { activitiesApi } from "@/lib/api";

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

const STORAGE_KEY = "activities";
const CATEGORIES_KEY = "categories";
const HISTORY_KEY = "activity_history";
const FAVORITES_KEY = "favorites";

export const ActivityProvider = ({ children }: { children: ReactNode }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: "cat_1", name: "Clubs", createdAt: new Date().toISOString() },
    { id: "cat_2", name: "Sports", createdAt: new Date().toISOString() },
    { id: "cat_3", name: "Events", createdAt: new Date().toISOString() },
  ]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load data from server with local fallback
  useEffect(() => {
    const loadData = async () => {
      try {
        const serverData = await activitiesApi.getAll();
        if (serverData && serverData.length > 0) {
          setActivities(serverData);
        } else {
          // Fallback to local
          const localData = JSON.parse(localStorage.getItem("activities") || "[]");
          setActivities(localData);
        }
      } catch (e) {
        console.error("Server load failed, using local:", e);
        const localData = JSON.parse(localStorage.getItem("activities") || "[]");
        setActivities(localData);
      }
    };
    loadData();
  }, []);

  // Save to local on change
  useEffect(() => {
    localStorage.setItem("activities", JSON.stringify(activities));
  }, [activities]);

  // Load favorites from localStorage (UI state)
  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addActivity = async (activity: Activity) => {
    const newActivity = { ...activity, createdAt: new Date().toISOString() };
    try {
      await activitiesApi.create(newActivity);
      // Reload to sync
      const data = await activitiesApi.getAll();
      setActivities(data);
    } catch {}
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    try {
      await activitiesApi.update(id, updates);
      // Reload to sync
      const data = await activitiesApi.getAll();
      setActivities(data);
    } catch {}
  };

  const deleteActivity = async (id: string) => {
    try {
      await activitiesApi.delete(id);
      // Reload to sync
      const data = await activitiesApi.getAll();
      setActivities(data);
    } catch {}
  };

  const registerForActivity = async (userId: string, activityId: string) => {
    try {
      await activitiesApi.register(activityId, userId);
      // Reload
      const data = await activitiesApi.getAll();
      setActivities(data);
    } catch (e) {
      console.error("Registration failed:", e);
    }
  };

  const unregisterFromActivity = async (userId: string, activityId: string) => {
    try {
      await activitiesApi.unregister(activityId, userId);
      // Reload
      const data = await activitiesApi.getAll();
      setActivities(data);
    } catch (e) {
      console.error("Unregister failed:", e);
    }
  };

  const joinWaitlist = (userId: string, activityId: string) => {
    // Local optimistic update
    setActivities(prev => prev.map(a => {
      if (a.id === activityId && !a.waitlist.includes(userId)) {
        return { ...a, waitlist: [...a.waitlist, userId] };
      }
      return a;
    }));
  };

  const leaveWaitlist = (userId: string, activityId: string) => {
    // Local optimistic update
    setActivities(prev => prev.map(a => {
      if (a.id === activityId) {
        return { ...a, waitlist: a.waitlist.filter(id => id !== userId) };
      }
      return a;
    }));
  };

  const getActivity = (id: string) => activities.find(a => a.id === id);
  const getUserActivities = (userId: string) => activities.filter(a => a.currentParticipants.includes(userId));

  const addComment = async (activityId: string, comment: Comment) => {
    const newComment = { ...comment, createdAt: new Date().toISOString() };
    try {
      await activitiesApi.addComment(activityId, { userId: comment.userId, userName: comment.userName, content: comment.content });
    } catch {}
    // Reload
    const data = await activitiesApi.getAll();
    setActivities(data);
  };

  const deleteComment = async (activityId: string, commentId: string) => {
    try {
      await activitiesApi.deleteComment(activityId, commentId);
    } catch {}
    // Reload
    const data = await activitiesApi.getAll();
    setActivities(data);
  };

  const addRating = async (activityId: string, rating: Rating) => {
    const newRating = { ...rating, createdAt: new Date().toISOString() };
    try {
      await activitiesApi.addRating(activityId, { userId: rating.userId, userName: rating.userName, score: rating.score, review: rating.review });
    } catch {}
    // Reload
    const data = await activitiesApi.getAll();
    setActivities(data);
  };

  const getUserActivityHistory = (userId: string): ActivityHistoryEntry[] => [];

  const addCategory = (category: Category) => {
    setCategories(prev => [...prev, category]);
  };

  const deleteCategory = (id: string) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
  };

  const addFavorite = (userId: string, activityId: string) => {
    const key = `${userId}_${activityId}`;
    if (!favorites.includes(key)) {
      setFavorites(prev => [...prev, key]);
    }
  };

  const removeFavorite = (userId: string, activityId: string) => {
    const key = `${userId}_${activityId}`;
    setFavorites(prev => prev.filter(f => f !== key));
  };

  const isFavorite = (userId: string, activityId: string) => favorites.includes(`${userId}_${activityId}`);

  const getFavoriteActivities = (userId: string) => {
    const userFavs = favorites.filter(f => f.startsWith(`${userId}_`));
    return activities.filter(a => userFavs.some(f => f.endsWith(`_${a.id}`)));
  };

  return (
    <ActivityContext.Provider value={{
      activities, addActivity, updateActivity, deleteActivity,
      registerForActivity, unregisterFromActivity, joinWaitlist, leaveWaitlist,
      addComment, deleteComment, addRating, getActivity, getUserActivities,
      getUserActivityHistory, categories, addCategory, deleteCategory,
      favorites, addFavorite, removeFavorite, isFavorite, getFavoriteActivities,
    }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivities = () => {
  const context = useContext(ActivityContext);
  if (!context) throw new Error("useActivities must be used within ActivityProvider");
  return context;
};

