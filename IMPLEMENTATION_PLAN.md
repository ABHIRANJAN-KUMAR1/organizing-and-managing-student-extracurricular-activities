# Implementation Plan - New Features

## Features to Add:

### 1. Activity Reminders System
- Add reminder notification feature that alerts users before activities start
- Allow users to opt-in/out of reminders
- Admin can send reminder notifications

### 2. PDF Export for Activities
- Export individual activity details as PDF
- Export list of activities as PDF
- Include activity info, registered participants, and statistics

### 3. Admin Broadcast Messages
- Admin can broadcast messages to all students
- Broadcast notifications appear for all users

### 4. Favorite Activities
- Students can mark activities as favorites
- Quick access to favorite activities

### 5. Enhanced Search
- Advanced search with more filters
- Search by multiple criteria

## Implementation Order:
1. Update types/index.ts with new interfaces
2. Update ActivityContext with reminder and favorites functionality
3. Create Broadcast Messages component
4. Add PDF export utilities
5. Update Activities page with new features
6. Update ActivityDetail with PDF export
7. Update routes in App.tsx
8. Update Sidebar with new menu items

## Files to Edit:
- client/types/index.ts
- client/context/ActivityContext.tsx
- client/pages/Activities.tsx
- client/pages/ActivityDetail.tsx
- client/App.tsx
- client/components/Sidebar.tsx

