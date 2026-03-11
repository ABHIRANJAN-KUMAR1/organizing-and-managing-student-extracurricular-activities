
import { Router } from "express";
import { activitiesDb, usersDb } from "../services/database.js";

const router = Router();

// Generate iCal format
const generateICal = (activities: any[]) => {
  let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Activity Hub Manager//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

  activities.forEach(activity => {
    const date = new Date(activity.date);
    const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(date.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    ical += `BEGIN:VEVENT
UID:${activity.id}@activityhub.com
DTSTAMP:${dateStr}
DTSTART:${dateStr}
DTEND:${endDate}
SUMMARY:${activity.title}
DESCRIPTION:${activity.description || ''}
LOCATION:${activity.venue || ''}
STATUS:CONFIRMED
END:VEVENT
`;
  });

  ical += 'END:VCALENDAR';
  return ical;
};

// Generate Google Calendar URL
const generateGoogleCalendarUrl = (activity: any) => {
  const date = new Date(activity.date);
  const startDate = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDate = new Date(date.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: activity.title,
    dates: `${startDate}/${endDate}`,
    details: activity.description || '',
    location: activity.venue || '',
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// Get calendar export for user (registered activities)
router.get("/user/:userId", (req, res) => {
  const userId = req.params.userId;
  const activities = activitiesDb.findAll();
  
  const userActivities = activities.filter(a => 
    a.currentParticipants?.includes(userId)
  );
  
  const format = req.query.format as string;
  
  if (format === 'google') {
    // Return Google Calendar links for each activity
    const links = userActivities.map(activity => ({
      title: activity.title,
      date: activity.date,
      venue: activity.venue,
      googleUrl: generateGoogleCalendarUrl(activity)
    }));
    return res.json(links);
  }
  
  if (format === 'ical') {
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="activities.ics"');
    return res.send(generateICal(userActivities));
  }
  
  // Default: return activities with calendar links
  const activitiesWithLinks = userActivities.map(activity => ({
    ...activity,
    googleCalendarUrl: generateGoogleCalendarUrl(activity)
  }));
  
  res.json(activitiesWithLinks);
});

// Get calendar export for all upcoming activities (public)
router.get("/upcoming", (req, res) => {
  const now = new Date();
  const activities = activitiesDb.findAll()
    .filter(a => new Date(a.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const format = req.query.format as string;
  
  if (format === 'google') {
    const links = activities.map(activity => ({
      title: activity.title,
      date: activity.date,
      venue: activity.venue,
      googleUrl: generateGoogleCalendarUrl(activity)
    }));
    return res.json(links);
  }
  
  if (format === 'ical') {
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="upcoming-activities.ics"');
    return res.send(generateICal(activities));
  }
  
  const activitiesWithLinks = activities.map(activity => ({
    ...activity,
    googleCalendarUrl: generateGoogleCalendarUrl(activity)
  }));
  
  res.json(activitiesWithLinks);
});

// Export single activity to calendar
router.get("/activity/:id", (req, res) => {
  const activity = activitiesDb.findById(req.params.id);
  
  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }
  
  const format = req.query.format as string;
  
  if (format === 'google') {
    return res.json({
      title: activity.title,
      date: activity.date,
      venue: activity.venue,
      description: activity.description,
      googleUrl: generateGoogleCalendarUrl(activity)
    });
  }
  
  if (format === 'ical') {
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${activity.title.replace(/[^a-z0-9]/gi, '-')}.ics"`);
    return res.send(generateICal([activity]));
  }
  
  res.json({
    ...activity,
    googleCalendarUrl: generateGoogleCalendarUrl(activity)
  });
});

// Batch export multiple activities
router.post("/batch-export", (req, res) => {
  const { activityIds } = req.body;
  
  if (!activityIds || !Array.isArray(activityIds)) {
    return res.status(400).json({ error: "activityIds array required" });
  }
  
  const activities = activitiesDb.findAll()
    .filter(a => activityIds.includes(a.id));
  
  const format = req.query.format as string;
  
  if (format === 'ical') {
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="selected-activities.ics"');
    return res.send(generateICal(activities));
  }
  
  const activitiesWithLinks = activities.map(activity => ({
    ...activity,
    googleCalendarUrl: generateGoogleCalendarUrl(activity)
  }));
  
  res.json(activitiesWithLinks);
});

export default router;

