import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Activity, ActivityContextType, Category, Comment, Rating, ActivityHistoryEntry } from "@/types";
import { activitiesApi } from "@/lib/api";

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

const STORAGE_KEY = "activities";
const CATEGORIES_KEY = "categories";
const HISTORY_KEY = "activity_history";
const FAVORITES_KEY = "favorites";

const generateDummyActivities = (): Activity[] => [
  {
    id: "1",
    title: "Basketball Tournament",
    description: "Inter-college basketball tournament",
    category: "Sports",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    venue: "Sports Complex",
    maxParticipants: 30,
    currentParticipants: [],
    waitlist: [],
    comments: [],
    ratings: [],
    createdBy: "admin1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Coding Club Meetup",
    description: "Weekly coding meetup",
    category: "Clubs",
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    venue: "Tech Lab",
    maxParticipants: 50,
    currentParticipants: [],
    waitlist: [],
    comments: [],
    ratings: [],
    createdBy: "admin1",
    createdAt: new Date().toISOString(),
  },
];

export const ActivityProvider = ({ children }: { children: ReactNode }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([
    { id: "cat_1", name: "Clubs", createdAt: new Date().toISOString() },
    { id: "cat_2", name: "Sports", createdAt: new Date().toISOString() },
    { id: "cat_3", name: "Events", createdAt: new Date().toISOString() },
  ]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const serverData = await activitiesApi.getAll();
        if (serverData && serverData.length > 0) {
          setActivities(serverData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
        }
      } catch (e) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setActivities(JSON.parse(stored));
      }
    };
    loadData();
  }, []);

  // Save to localStorage when activities change
  useEffect(() => {
    if (activities.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    }
  }, [activities]);

  // Save favorites
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addActivity = async (activity: Activity) => {
    const newActivity = { ...activity, createdAt: new Date().toISOString() };
    try { await activitiesApi.create(newActivity); } catch {}
    setActivities(prev => [...prev, newActivity]);
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    try { await activitiesApi.update(id, updates); } catch {}
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteActivity = async (id: string) => {
    try { await activitiesApi.delete(id); } catch {}
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const registerForActivity = async (userId: string, activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;
    if (activity.currentParticipants.includes(userId)) return;

    const updated = [...activity.currentParticipants, userId];
    
    // Save to server
    try {
      await activitiesApi.register(activityId, userId);
    } catch (e) {
      console.log("Server error, saving locally");
    }
    
    // Update local
    setActivities(prev => prev.map(a => 
      a.id === activityId ? { ...a, currentParticipants: updated } : a
    ));
    
    // Reload from server
    try {
      const data = await activitiesApi.getAll();
      if (data) setActivities(data);
    } catch {}
  };

  const unregisterFromActivity = async (userId: string, activityId: string) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    const updated = activity.currentParticipants.filter(id => id !== userId);
    
    try { await activitiesApi.unregister(activityId, userId); } catch {}
    setActivities(prev => prev.map(a => 
      a.id === activityId ? { ...a, currentParticipants: updated } : a
    ));
  };

  const joinWaitlist = (userId: string, activityId: string) => {
    setActivities(prev => prev.map(a => {
      if (a.id === activityId && !a.waitlist.includes(userId)) {
        return { ...a, waitlist: [...a.waitlist, userId] };
      }
      return a;
    }));
  };

  const leaveWaitlist = (userId: string, activityId: string) => {
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
    setActivities(prev => prev.map(a => {
      if (a.id === activityId) return { ...a, comments: [...a.comments, newComment] };
      return a;
    }));
  };

  const deleteComment = async (activityId: string, commentId: string) => {
    try { await activitiesApi.deleteComment(activityId, commentId); } catch {}
    setActivities(prev => prev.map(a => {
      if (a.id === activityId) return { ...a, comments: a.comments.filter(c => c.id !== commentId) };
      return a;
    }));
  };

  const addRating = async (activityId: string, rating: Rating) => {
    const newRating = { ...rating, createdAt: new Date().toISOString() };
    try {
      await activitiesApi.addRating(activityId, { userId: rating.userId, userName: rating.userName, score: rating.score, review: rating.review });
    } catch {}
    setActivities(prev => prev.map(a => {
      if (a.id === activityId) return { ...a, ratings: [...a.ratings, newRating] };
      return a;
    }));
  };

  const getUserActivityHistory = (userId: string): ActivityHistoryEntry[] => {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    try {
      const history = JSON.parse(stored);
      return history.filter((entry: ActivityHistoryEntry) => entry.userId === userId);
    } catch { return []; }
  };

  const addCategory = (category: Category) => {
    setCategories(prev => [...prev, category]);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify([...categories, category]));
  };

  const deleteCategory = (id: string) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  };

  const addFavorite = (userId: string, activityId: string) => {
    const key = `${userId}_${activityId}`;
    if (!favorites.includes(key)) setFavorites(prev => [...prev, key]);
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
