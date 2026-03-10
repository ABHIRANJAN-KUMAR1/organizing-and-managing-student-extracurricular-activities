import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Activity, ActivityContextType, Category, Comment, Rating, ActivityHistoryEntry } from "@/types";
import { useNotifications } from "./NotificationContext";

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

const STORAGE_KEY = "activities";
const CATEGORIES_KEY = "categories";
const HISTORY_KEY = "activity_history";
const FAVORITES_KEY = "favorites";

// Initialize with some dummy data
const generateDummyActivities = (): Activity[] => [
  {
    id: "1",
    title: "Basketball Tournament",
    description: "Inter-college basketball tournament with exciting matches",
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
    description: "Weekly meetup for coding enthusiasts to discuss new technologies",
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
  {
    id: "3",
    title: "Annual Fest 2024",
    description: "Grand annual fest with music, food, and various competitions",
    category: "Events",
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    venue: "Main Auditorium",
    maxParticipants: 500,
    currentParticipants: [],
    waitlist: [],
    comments: [],
    ratings: [],
    createdBy: "admin1",
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Debate Competition",
    description: "Inter-class debate competition on various topics",
    category: "Events",
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    venue: "Hall A",
    maxParticipants: 100,
    currentParticipants: [],
    waitlist: [],
    comments: [],
    ratings: [],
    createdBy: "admin1",
    createdAt: new Date().toISOString(),
  },
];

const generateDummyCategories = (): Category[] => [
  { id: "cat_1", name: "Clubs", createdAt: new Date().toISOString() },
  { id: "cat_2", name: "Sports", createdAt: new Date().toISOString() },
  { id: "cat_3", name: "Events", createdAt: new Date().toISOString() },
];

export const ActivityProvider = ({ children }: { children: ReactNode }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const storedFavorites = localStorage.getItem(FAVORITES_KEY);
    if (storedFavorites) {
      try {
        setFavorites(JSON.parse(storedFavorites));
      } catch (error) {
        console.error("Failed to parse stored favorites:", error);
      }
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  // Add favorite function
  const addFavorite = (userId: string, activityId: string) => {
    const favoriteKey = `${userId}_${activityId}`;
    if (!favorites.includes(favoriteKey)) {
      setFavorites((prev) => [...prev, favoriteKey]);
    }
  };

  // Remove favorite function
  const removeFavorite = (userId: string, activityId: string) => {
    const favoriteKey = `${userId}_${activityId}`;
    setFavorites((prev) => prev.filter((f) => f !== favoriteKey));
  };

  // Check if activity is favorite
  const isFavorite = (userId: string, activityId: string): boolean => {
    const favoriteKey = `${userId}_${activityId}`;
    return favorites.includes(favoriteKey);
  };

  // Get favorite activities for a user
  const getFavoriteActivities = (userId: string): Activity[] => {
    const userFavorites = favorites.filter((f) => f.startsWith(`${userId}_`));
    return activities.filter((activity) =>
      userFavorites.some((f) => f.endsWith(`_${activity.id}`))
    );
  };

  // Load activities from localStorage on mount
  useEffect(() => {
    const storedActivities = localStorage.getItem(STORAGE_KEY);
    if (storedActivities) {
      try {
        setActivities(JSON.parse(storedActivities));
      } catch (error) {
        console.error("Failed to parse stored activities:", error);
        const dummyData = generateDummyActivities();
        setActivities(dummyData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dummyData));
      }
    } else {
      const dummyData = generateDummyActivities();
      setActivities(dummyData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dummyData));
    }
  }, []);

  // Load categories from localStorage on mount
  useEffect(() => {
    const storedCategories = localStorage.getItem(CATEGORIES_KEY);
    if (storedCategories) {
      try {
        setCategories(JSON.parse(storedCategories));
      } catch (error) {
        console.error("Failed to parse stored categories:", error);
        const dummyData = generateDummyCategories();
        setCategories(dummyData);
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(dummyData));
      }
    } else {
      const dummyData = generateDummyCategories();
      setCategories(dummyData);
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(dummyData));
    }
  }, []);

  // Save activities to localStorage whenever they change
  useEffect(() => {
    if (activities.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    }
  }, [activities]);

  const addActivity = (activity: Activity) => {
    setActivities((prev) => [...prev, activity]);
  };

  const updateActivity = (id: string, updates: Partial<Activity>) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === id ? { ...activity, ...updates } : activity
      )
    );
  };

  const deleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((activity) => activity.id !== id));
  };

  const registerForActivity = (userId: string, activityId: string) => {
    setActivities((prev) =>
      prev.map((activity) => {
        if (activity.id === activityId) {
          const participants = new Set(activity.currentParticipants);
          participants.add(userId);
          return {
            ...activity,
            currentParticipants: Array.from(participants),
          };
        }
        return activity;
      })
    );
  };

  const unregisterFromActivity = (userId: string, activityId: string) => {
    setActivities((prev) =>
      prev.map((activity) => {
        if (activity.id === activityId) {
          return {
            ...activity,
            currentParticipants: activity.currentParticipants.filter(
              (id) => id !== userId
            ),
          };
        }
        return activity;
      })
    );
  };

  const joinWaitlist = (userId: string, activityId: string) => {
    setActivities((prev) =>
      prev.map((activity) => {
        if (activity.id === activityId) {
          const waitlist = new Set(activity.waitlist);
          waitlist.add(userId);
          return {
            ...activity,
            waitlist: Array.from(waitlist),
          };
        }
        return activity;
      })
    );
  };

  const leaveWaitlist = (userId: string, activityId: string) => {
    setActivities((prev) =>
      prev.map((activity) => {
        if (activity.id === activityId) {
          return {
            ...activity,
            waitlist: activity.waitlist.filter((id) => id !== userId),
          };
        }
        return activity;
      })
    );
  };

  const getActivity = (id: string): Activity | undefined => {
    return activities.find((activity) => activity.id === id);
  };

  const getUserActivities = (userId: string): Activity[] => {
    return activities.filter((activity) =>
      activity.currentParticipants.includes(userId)
    );
  };

  const addComment = (activityId: string, comment: Comment) => {
    setActivities((prev) =>
      prev.map((activity) => {
        if (activity.id === activityId) {
          return {
            ...activity,
            comments: [...activity.comments, comment],
          };
        }
        return activity;
      })
    );
  };

  const deleteComment = (activityId: string, commentId: string) => {
    setActivities((prev) =>
      prev.map((activity) => {
        if (activity.id === activityId) {
          return {
            ...activity,
            comments: activity.comments.filter((c) => c.id !== commentId),
          };
        }
        return activity;
      })
    );
  };

  const addRating = (activityId: string, rating: Rating) => {
    setActivities((prev) =>
      prev.map((activity) => {
        if (activity.id === activityId) {
          return {
            ...activity,
            ratings: [...activity.ratings, rating],
          };
        }
        return activity;
      })
    );
  };

  const getUserActivityHistory = (userId: string): ActivityHistoryEntry[] => {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
      try {
        const history = JSON.parse(stored);
        return history.filter((entry: ActivityHistoryEntry) => entry.userId === userId);
      } catch {
        return [];
      }
    }
    return [];
  };

  const addCategory = (category: Category) => {
    setCategories((prev) => [...prev, category]);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify([...categories, category]));
  };

  const deleteCategory = (id: string) => {
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
  };

  return (
    <ActivityContext.Provider
      value={{
        activities,
        addActivity,
        updateActivity,
        deleteActivity,
        registerForActivity,
        unregisterFromActivity,
        joinWaitlist,
        leaveWaitlist,
        addComment,
        deleteComment,
        addRating,
        getActivity,
        getUserActivities,
        getUserActivityHistory,
        categories,
        addCategory,
        deleteCategory,
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        getFavoriteActivities,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivities = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error("useActivities must be used within ActivityProvider");
  }
  return context;
};
