# New Features Implementation Plan

## Features to Add:

### 1. Activity Check-in System
- Admin can check-in participants at events
- Track attendance

### 2. Activity Feedback Form
- Detailed feedback form after events
- Rate various aspects

### 3. User Statistics
- Detailed stats per user
- Activities joined, ratings given, etc.

### 4. Notification Settings
- Configure notification preferences
- Toggle different notification types

### 5. Activity Reminders
- Set reminders for upcoming activities
- Browser notifications

### 6. Activity Tags
- Add custom tags to activities
- Filter by tags

### 7. Registration Approval
- Admin needs to approve registrations
- Pending/approved/rejected status

### 8. Activity Photos Gallery
- Upload photos from activities
- View gallery

## Implementation Order:
1. Update types/index.ts
2. Update ActivityContext
3. Create CheckIn page
4. Create Feedback page
5. Create UserStats page
6. Create NotificationSettings page
7. Create TagsManagement page
8. Update ActivityForm for tags and approval
9. Update App.tsx with routes
10. Update Sidebar

