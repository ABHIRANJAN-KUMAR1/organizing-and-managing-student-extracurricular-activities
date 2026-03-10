import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Notification, NotificationContextType } from "@/types";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Separate keys for user-specific and admin notifications
const USER_NOTIFICATIONS_KEY = "user_notifications";
const ADMIN_NOTIFICATIONS_KEY = "admin_notifications";
const BROADCAST_NOTIFICATIONS_KEY = "broadcast_notifications"; // Shared between all users

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  // Load notifications from localStorage on mount and when user changes
  useEffect(() => {
    const loadNotifications = () => {
      const allNotifications: Notification[] = [];
      
      // Always load broadcast notifications for all users
      const broadcastStored = localStorage.getItem(BROADCAST_NOTIFICATIONS_KEY);
      if (broadcastStored) {
        try {
          const broadcastNotifications = JSON.parse(broadcastStored);
          allNotifications.push(...broadcastNotifications);
        } catch (error) {
          console.error("Failed to parse broadcast notifications:", error);
        }
      }
      
      // Load role-specific notifications
      if (user?.role === "admin") {
        const adminStored = localStorage.getItem(ADMIN_NOTIFICATIONS_KEY);
        if (adminStored) {
          try {
            const adminNotifications = JSON.parse(adminStored);
            allNotifications.push(...adminNotifications);
          } catch (error) {
            console.error("Failed to parse admin notifications:", error);
          }
        }
      } else {
        // For students, load from user notifications
        const stored = localStorage.getItem(USER_NOTIFICATIONS_KEY);
        if (stored) {
          try {
            const userNotifications = JSON.parse(stored);
            allNotifications.push(...userNotifications);
          } catch (error) {
            console.error("Failed to parse notifications:", error);
          }
        }
      }
      
      // Sort by createdAt (newest first)
      allNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setNotifications(allNotifications);
    };
    
    loadNotifications();
  }, [user]);

  // Save to localStorage whenever notifications change
  useEffect(() => {
    if (user?.role === "admin") {
      localStorage.setItem(ADMIN_NOTIFICATIONS_KEY, JSON.stringify(notifications));
    } else {
      localStorage.setItem(USER_NOTIFICATIONS_KEY, JSON.stringify(notifications));
    }
  }, [notifications, user]);

  // Filter notifications based on user role
  const getFilteredNotifications = () => {
    if (!user) return notifications;
    
    // Admin sees: notifications for admin role
    if (user.role === "admin") {
      return notifications.filter(n => n.targetRole === "admin");
    }
    
    // Student sees: notifications for student role
    return notifications.filter(n => n.targetRole === "student");
  };

  const addNotification = (notification: Omit<Notification, "id" | "createdAt" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  // Add notification for all students - when admin creates activity
  const addBroadcastNotification = (title: string, message: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const newNotification: Notification = {
      title,
      message,
      type,
      userId: undefined,
      targetRole: "student",
      id: `notif_${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    
    // Save to broadcast storage (shared between all users)
    const broadcastNotifications = JSON.parse(localStorage.getItem(BROADCAST_NOTIFICATIONS_KEY) || "[]");
    const updatedBroadcastNotifications = [newNotification, ...broadcastNotifications];
    localStorage.setItem(BROADCAST_NOTIFICATIONS_KEY, JSON.stringify(updatedBroadcastNotifications));
    
    // Also add to current state
    setNotifications((prev) => [newNotification, ...prev]);
  };

  // Add notification to admin when student registers
  const notifyAdminOfRegistration = (studentName: string, activityTitle: string) => {
    const message = activityTitle 
      ? `${studentName} has registered for "${activityTitle}"`
      : `${studentName} has registered as a new student`;
      
    const newNotification: Notification = {
      title: "New Student Registration",
      message,
      type: "info",
      userId: undefined,
      targetRole: "admin",
      id: `notif_${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    
    // Store directly in admin notifications storage
    const adminNotifications = JSON.parse(localStorage.getItem(ADMIN_NOTIFICATIONS_KEY) || "[]");
    const updatedAdminNotifications = [newNotification, ...adminNotifications];
    localStorage.setItem(ADMIN_NOTIFICATIONS_KEY, JSON.stringify(updatedAdminNotifications));
    
    // Also add to current state if admin is logged in
    setNotifications((prev) => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Get filtered notifications based on current user
  const filteredNotifications = getFilteredNotifications();
  const unreadCount = filteredNotifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications: filteredNotifications,
        addNotification,
        addBroadcastNotification,
        notifyAdminOfRegistration,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};
