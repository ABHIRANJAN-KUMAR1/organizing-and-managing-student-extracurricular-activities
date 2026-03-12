import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import activitiesRouter from "./routes/activities";
import usersRouter from "./routes/users";
import feedbacksRouter from "./routes/feedbacks";
import checkInsRouter from "./routes/checkins";
import tagsRouter from "./routes/tags";
import notificationsRouter from "./routes/notifications";
import notificationSettingsRouter from "./routes/notificationSettings";
import favoritesRouter from "./routes/favorites";
import certificatesRouter from "./routes/certificates";
import broadcastRouter from "./routes/broadcast";
import remindersRouter from "./routes/reminders";
import activityHistoryRouter from "./routes/activityHistory";
import analyticsRouter from "./routes/analytics";
import calendarRouter from "./routes/calendar";
import userPreferencesRouter from "./routes/userPreferences";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // API Routes
  app.use("/api/activities", activitiesRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/feedbacks", feedbacksRouter);
  app.use("/api/checkins", checkInsRouter);
  app.use("/api/tags", tagsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/notification-settings", notificationSettingsRouter);
  app.use("/api/favorites", favoritesRouter);
  app.use("/api/certificates", certificatesRouter);
  app.use("/api/broadcast", broadcastRouter);
  app.use("/api/reminders", remindersRouter);
  app.use("/api/activity-history", activityHistoryRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/calendar", calendarRouter);
  app.use("/api/user-preferences", userPreferencesRouter);

  return app;
}
