const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Helper function for API calls
const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong");
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

// Activities API
export const activitiesApi = {
  getAll: () => apiCall("/activities"),
  getById: (id: string) => apiCall(`/activities/${id}`),
  create: (data: any) => apiCall("/activities", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiCall(`/activities/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/activities/${id}`, { method: "DELETE" }),
  
  register: (activityId: string, userId: string) => 
    apiCall(`/activities/${activityId}/register`, { method: "POST", body: JSON.stringify({ userId }) }),
  
  unregister: (activityId: string, userId: string) => 
    apiCall(`/activities/${activityId}/unregister`, { method: "POST", body: JSON.stringify({ userId }) }),
  
  joinWaitlist: (activityId: string, userId: string) => 
    apiCall(`/activities/${activityId}/waitlist`, { method: "POST", body: JSON.stringify({ userId }) }),
  
  leaveWaitlist: (activityId: string, userId: string) => 
    apiCall(`/activities/${activityId}/leave-waitlist`, { method: "POST", body: JSON.stringify({ userId }) }),
  
  addComment: (activityId: string, data: { userId: string; userName: string; content: string }) => 
    apiCall(`/activities/${activityId}/comments`, { method: "POST", body: JSON.stringify(data) }),
  
  deleteComment: (activityId: string, commentId: string) => 
    apiCall(`/activities/${activityId}/comments/${commentId}`, { method: "DELETE" }),
  
  addRating: (activityId: string, data: { userId: string; userName: string; score: number; review?: string }) => 
    apiCall(`/activities/${activityId}/ratings`, { method: "POST", body: JSON.stringify(data) }),
  
  addPhoto: (activityId: string, data: { url: string; caption?: string; uploadedBy: string }) => 
    apiCall(`/activities/${activityId}/photos`, { method: "POST", body: JSON.stringify(data) }),
  
  getCategories: () => apiCall("/activities/categories"),
  addCategory: (name: string) => apiCall("/activities/categories", { method: "POST", body: JSON.stringify({ name }) }),
  updateCategory: (id: string, data: any) => apiCall(`/activities/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCategory: (id: string) => apiCall(`/activities/categories/${id}`, { method: "DELETE" }),
};

// Users API
export const usersApi = {
  register: (data: { email: string; name: string; password: string; role?: string }) =>
    apiCall("/users/register", { method: "POST", body: JSON.stringify(data) }),
  
  login: (data: { email: string; password: string }) =>
    apiCall("/users/login", { method: "POST", body: JSON.stringify(data) }),
  
  getMe: () => apiCall("/users/me"),
  
  getById: (id: string) => apiCall(`/users/${id}`),
  
  updateProfile: (data: { name?: string; email?: string }) =>
    apiCall("/users/profile", { method: "PUT", body: JSON.stringify(data) }),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiCall("/users/password", { method: "PUT", body: JSON.stringify(data) }),
  
  getAll: () => apiCall("/users"),
  
  getAchievements: (userId: string) => apiCall(`/users/${userId}/achievements`),
  
  addAchievement: (userId: string, achievementType: string) =>
    apiCall(`/users/${userId}/achievements`, { method: "POST", body: JSON.stringify({ achievementType }) }),
  
  verifyEmail: (code: string) =>
    apiCall("/users/verify-email", { method: "POST", body: JSON.stringify({ code }) }),
  
  forgotPassword: (email: string) =>
    apiCall("/users/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  
  resetPassword: (code: string, newPassword: string) =>
    apiCall("/users/reset-password", { method: "POST", body: JSON.stringify({ code, newPassword }) }),
};

// Feedbacks API
export const feedbacksApi = {
  getAll: () => apiCall("/feedbacks"),
  getById: (id: string) => apiCall(`/feedbacks/${id}`),
  getByActivity: (activityId: string) => apiCall(`/feedbacks/activity/${activityId}`),
  getByUser: (userId: string) => apiCall(`/feedbacks/user/${userId}`),
  create: (data: any) => apiCall("/feedbacks", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/feedbacks/${id}`, { method: "DELETE" }),
};

// Check-ins API
export const checkInsApi = {
  getAll: () => apiCall("/checkins"),
  getById: (id: string) => apiCall(`/checkins/${id}`),
  getByActivity: (activityId: string) => apiCall(`/checkins/activity/${activityId}`),
  getByUser: (userId: string) => apiCall(`/checkins/user/${userId}`),
  checkIn: (data: { userId: string; userName: string; activityId: string; checkedInBy: string }) =>
    apiCall("/checkins", { method: "POST", body: JSON.stringify(data) }),
  checkOut: (id: string) => apiCall(`/checkins/${id}/checkout`, { method: "POST" }),
  delete: (id: string) => apiCall(`/checkins/${id}`, { method: "DELETE" }),
};

// Tags API
export const tagsApi = {
  getAll: () => apiCall("/tags"),
  getById: (id: string) => apiCall(`/tags/${id}`),
  create: (data: { name: string; color?: string }) => apiCall("/tags", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiCall(`/tags/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/tags/${id}`, { method: "DELETE" }),
};

// Notifications API
export const notificationsApi = {
  getAll: () => apiCall("/notifications"),
  getByUser: (userId: string) => apiCall(`/notifications/user/${userId}`),
  getByRole: (role: string) => apiCall(`/notifications/role/${role}`),
  getUnreadCount: (userId: string) => apiCall(`/notifications/unread/${userId}`),
  markAsRead: (id: string) => apiCall(`/notifications/${id}/read`, { method: "PUT" }),
  markAllAsRead: (userId: string) => apiCall(`/notifications/read-all/${userId}`, { method: "PUT" }),
  create: (data: any) => apiCall("/notifications", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/notifications/${id}`, { method: "DELETE" }),
  clearRead: (userId: string) => apiCall(`/notifications/clear/${userId}`, { method: "DELETE" }),
};

// Notification Settings API
export const notificationSettingsApi = {
  get: (userId: string) => apiCall(`/notification-settings/${userId}`),
  update: (userId: string, data: any) => apiCall(`/notification-settings/${userId}`, { method: "PUT", body: JSON.stringify(data) }),
};

// Favorites API
export const favoritesApi = {
  getByUser: (userId: string) => apiCall(`/favorites/user/${userId}`),
  checkIsFavorite: (userId: string, activityId: string) => apiCall(`/favorites/${userId}/${activityId}`),
  add: (userId: string, activityId: string) => apiCall("/favorites", { method: "POST", body: JSON.stringify({ userId, activityId }) }),
  remove: (id: string) => apiCall(`/favorites/${id}`, { method: "DELETE" }),
  removeByActivity: (userId: string, activityId: string) => apiCall(`/favorites/user/${userId}/activity/${activityId}`, { method: "DELETE" }),
};

// Certificates API
export const certificatesApi = {
  getAll: () => apiCall("/certificates"),
  getById: (id: string) => apiCall(`/certificates/${id}`),
  getByUser: (userId: string) => apiCall(`/certificates/user/${userId}`),
  getByActivity: (activityId: string) => apiCall(`/certificates/activity/${activityId}`),
  issue: (activityId: string, userId: string) => apiCall("/certificates", { method: "POST", body: JSON.stringify({ activityId, userId }) }),
  verify: (id: string) => apiCall(`/certificates/verify/${id}`),
};

// Broadcast API
export const broadcastApi = {
  getAll: () => apiCall("/broadcast"),
  getById: (id: string) => apiCall(`/broadcast/${id}`),
  send: (data: { title: string; message: string; targetRole: string; sendEmail?: boolean }) =>
    apiCall("/broadcast", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) => apiCall(`/broadcast/${id}`, { method: "DELETE" }),
};

// Reminders API
export const remindersApi = {
  getAll: () => apiCall("/reminders"),
  getById: (id: string) => apiCall(`/reminders/${id}`),
  getByActivity: (activityId: string) => apiCall(`/reminders/activity/${activityId}`),
  getByUser: (userId: string) => apiCall(`/reminders/user/${userId}`),
  getPending: () => apiCall("/reminders/pending/now"),
  create: (data: { activityId: string; userId: string; reminderTime: string }) =>
    apiCall("/reminders", { method: "POST", body: JSON.stringify(data) }),
  send: (id: string) => apiCall(`/reminders/${id}/send`, { method: "POST" }),
  delete: (id: string) => apiCall(`/reminders/${id}`, { method: "DELETE" }),
};

// Activity History API
export const activityHistoryApi = {
  getAll: () => apiCall("/activity-history"),
  getById: (id: string) => apiCall(`/activity-history/${id}`),
  getByUser: (userId: string) => apiCall(`/activity-history/user/${userId}`),
  getByActivity: (activityId: string) => apiCall(`/activity-history/activity/${activityId}`),
  register: (data: { activityId: string; userId: string; status: string }) =>
    apiCall("/activity-history/register", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiCall(`/activity-history/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  cancel: (id: string) => apiCall(`/activity-history/${id}/cancel`, { method: "POST" }),
  attend: (id: string) => apiCall(`/activity-history/${id}/attend`, { method: "POST" }),
  delete: (id: string) => apiCall(`/activity-history/${id}`, { method: "DELETE" }),
};

export default {
  activitiesApi,
  usersApi,
  feedbacksApi,
  checkInsApi,
  tagsApi,
  notificationsApi,
  notificationSettingsApi,
  favoritesApi,
  certificatesApi,
  broadcastApi,
  remindersApi,
  activityHistoryApi,
};
