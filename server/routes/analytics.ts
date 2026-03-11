
import { Router } from "express";
import { activitiesDb, usersDb } from "../services/database.js";

const router = Router();

// Get analytics overview
router.get("/overview", (_req, res) => {
  const activities = activitiesDb.findAll();
  const users = usersDb.findAll();
  
  const totalActivities = activities.length;
  const upcoming = activities.filter(a => new Date(a.date) > new Date()).length;
  const completed = activities.filter(a => new Date(a.date) < new Date()).length;
  const totalRegistrations = activities.reduce((sum, a) => sum + (a.currentParticipants?.length || 0), 0);
  const totalCapacity = activities.reduce((sum, a) => sum + (a.maxParticipants || 0), 0);
  const totalCheckIns = activities.reduce((sum, a) => sum + (a.checkIns?.length || 0), 0);
  const totalComments = activities.reduce((sum, a) => sum + (a.comments?.length || 0), 0);
  const totalRatings = activities.reduce((sum, a) => sum + (a.ratings?.length || 0), 0);
  
  const attendanceRate = totalRegistrations > 0 ? Math.round((totalCheckIns / totalRegistrations) * 100) : 0;
  const fillRate = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;
  const avgRegistrations = totalActivities > 0 ? (totalRegistrations / totalActivities).toFixed(1) : "0";
  
  let totalRating = 0;
  let totalReviews = 0;
  activities.forEach(activity => {
    activity.ratings?.forEach((rating: any) => {
      totalRating += rating.score;
      totalReviews++;
    });
  });
  const avgRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : "0";
  
  const engagementScore = Math.min(100, Math.round(
    (attendanceRate * 0.3) + (fillRate * 0.3) + 
    (totalComments / Math.max(totalActivities, 1) * 10) + 
    (totalRatings / Math.max(totalActivities, 1) * 10)
  ));

  res.json({
    totalStudents: users.length,
    totalActivities,
    upcoming,
    completed,
    totalRegistrations,
    totalCapacity,
    totalCheckIns,
    totalComments,
    totalRatings,
    attendanceRate,
    avgRegistrations,
    fillRate,
    avgRating,
    totalReviews,
    engagementScore
  });
});

// Get category analytics
router.get("/categories", (_req, res) => {
  const activities = activitiesDb.findAll();
  const categoryMap: Record<string, { activities: number; registrations: number; checkIns: number }> = {};
  
  activities.forEach(activity => {
    const cat = activity.category || "Other";
    if (!categoryMap[cat]) {
      categoryMap[cat] = { activities: 0, registrations: 0, checkIns: 0 };
    }
    categoryMap[cat].activities++;
    categoryMap[cat].registrations += activity.currentParticipants?.length || 0;
    categoryMap[cat].checkIns += activity.checkIns?.length || 0;
  });
  
  const categoryData = Object.entries(categoryMap).map(([name, data]) => ({ name, ...data }));
  res.json(categoryData);
});

// Get weekly analytics
router.get("/weekly", (_req, res) => {
  const activities = activitiesDb.findAll();
  const weeks = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    
    const weekActivities = activities.filter(a => {
      const date = new Date(a.date);
      return date >= weekStart && date < weekEnd;
    });
    
    weeks.push({
      week: `Week ${6 - i}`,
      activities: weekActivities.length,
      registrations: weekActivities.reduce((sum, a) => sum + (a.currentParticipants?.length || 0), 0),
      checkIns: weekActivities.reduce((sum, a) => sum + (a.checkIns?.length || 0), 0)
    });
  }
  
  res.json(weeks);
});

// Get monthly analytics
router.get("/monthly", (_req, res) => {
  const activities = activitiesDb.findAll();
  const months = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    
    const monthActivities = activities.filter(a => {
      const date = new Date(a.date);
      return date >= monthStart && date <= monthEnd;
    });
    
    months.push({
      month: monthStart.toLocaleDateString("en-US", { month: "short" }),
      activities: monthActivities.length,
      registrations: monthActivities.reduce((sum, a) => sum + (a.currentParticipants?.length || 0), 0)
    });
  }
  
  res.json(months);
});

// Get top activities
router.get("/top-activities", (_req, res) => {
  const activities = activitiesDb.findAll();
  
  const topActivities = activities
    .sort((a, b) => (b.currentParticipants?.length || 0) - (a.currentParticipants?.length || 0))
    .slice(0, 10)
    .map(a => ({
      id: a.id,
      title: a.title,
      registrations: a.currentParticipants?.length || 0,
      capacity: a.maxParticipants,
      percentage: Math.round(((a.currentParticipants?.length || 0) / a.maxParticipants) * 100),
      checkIns: a.checkIns?.length || 0,
      rating: a.ratings?.length 
        ? (a.ratings.reduce((sum: number, r: any) => sum + r.score, 0) / a.ratings.length).toFixed(1)
        : "N/A"
    }));
  
  res.json(topActivities);
});

// Get top students
router.get("/top-students", (_req, res) => {
  const activities = activitiesDb.findAll();
  const users = usersDb.findAll();
  
  const studentStats: Record<string, { name: string; email: string; count: number; checkIns: number }> = {};
  
  activities.forEach(activity => {
    activity.currentParticipants?.forEach((studentId: string) => {
      if (!studentStats[studentId]) {
        const user = users.find(u => u.id === studentId);
        studentStats[studentId] = { 
          name: user?.name || "Unknown", 
          email: user?.email || "", 
          count: 0, 
          checkIns: 0 
        };
      }
      studentStats[studentId].count++;
    });
    
    activity.checkIns?.forEach((checkIn: any) => {
      if (studentStats[checkIn.userId]) {
        studentStats[checkIn.userId].checkIns++;
      }
    });
  });
  
  const topStudents = Object.entries(studentStats)
    .map(([id, data]) => ({
      id,
      ...data,
      attendanceRate: data.count > 0 ? Math.round((data.checkIns / data.count) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  res.json(topStudents);
});

// Get rating distribution
router.get("/ratings", (_req, res) => {
  const activities = activitiesDb.findAll();
  
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRating = 0;
  let totalReviews = 0;
  
  activities.forEach(activity => {
    activity.ratings?.forEach((rating: any) => {
      totalRating += rating.score;
      totalReviews++;
      if (ratingCounts[rating.score as keyof typeof ratingCounts]) {
        ratingCounts[rating.score as keyof typeof ratingCounts]++;
      }
    });
  });
  
  const avgRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : "0";
  
  res.json({
    avgRating,
    totalReviews,
    ratingCounts: Object.entries(ratingCounts).map(([rating, count]) => ({ rating: parseInt(rating), count }))
  });
});

// Get activity heatmap data (last 30 days)
router.get("/heatmap", (_req, res) => {
  const activities = activitiesDb.findAll();
  const days = [];
  const now = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayActivities = activities.filter(a => {
      const actDate = new Date(a.date);
      return actDate.toDateString() === date.toDateString();
    });
    
    days.push({
      date: date.toISOString().split("T")[0],
      day: date.getDate(),
      activities: dayActivities.length,
      registrations: dayActivities.reduce((sum, a) => sum + (a.currentParticipants?.length || 0), 0),
      intensity: Math.min(dayActivities.length / 3, 1)
    });
  }
  
  res.json(days);
});

export default router;

