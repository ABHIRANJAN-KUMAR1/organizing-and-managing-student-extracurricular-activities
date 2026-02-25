export type UserRole = "admin" | "student";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  isVerified?: boolean;
  verificationCode?: string;
}

export type ActivityCategory = string;

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  date: string;
  venue: string;
  maxParticipants: number;
  currentParticipants: string[]; // Array of user IDs
  waitlist: string[]; // Array of user IDs on waitlist
  comments: Comment[]; // Comments on activity
  ratings: Rating[]; // Ratings for activity
  createdBy: string; // Admin user ID
  createdAt: string;
  reminderSent?: boolean; // Whether reminder has been sent
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface Rating {
  id: string;
  userId: string;
  userName: string;
  score: number; // 1-5
  review?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
}

// User Activity History Entry
export interface ActivityHistoryEntry {
  id: string;
  activityId: string;
  activityTitle: string;
  userId: string;
  status: "registered" | "waitlisted" | "attended" | "cancelled";
  registeredAt: string;
  cancelledAt?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  register: (user: User) => void;
  verifyEmail: (code: string) => boolean;
}

export interface ActivityContextType {
  activities: Activity[];
  addActivity: (activity: Activity) => void;
  updateActivity: (id: string, activity: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  registerForActivity: (userId: string, activityId: string) => void;
  unregisterFromActivity: (userId: string, activityId: string) => void;
  joinWaitlist: (userId: string, activityId: string) => void;
  leaveWaitlist: (userId: string, activityId: string) => void;
  addComment: (activityId: string, comment: Comment) => void;
  deleteComment: (activityId: string, commentId: string) => void;
  addRating: (activityId: string, rating: Rating) => void;
  getActivity: (id: string) => Activity | undefined;
  getUserActivities: (userId: string) => Activity[];
  getUserActivityHistory: (userId: string) => ActivityHistoryEntry[];
  categories: Category[];
  addCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
}

export interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  unreadCount: number;
}
