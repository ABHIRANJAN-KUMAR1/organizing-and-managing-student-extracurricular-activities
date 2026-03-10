# New Features Implementation TODO

## Phase 1: Photos Gallery ✅
- [x] 1. Update types/index.ts to add photo-related interfaces
- [x] 2. Update ActivityForm to allow photo uploads (admin can add via ActivityDetail)
- [x] 3. Update ActivityDetail to display photo gallery
- [x] 4. Create PhotoGallery component

## Phase 2: Calendar Integration (iCal Export) ✅
- [x] 5. Create calendar export utility (lib/calendarExport.ts)
- [x] 6. Add "Add to Calendar" button to ActivityDetail

## Phase 3: Activity Sharing ✅
- [x] 7. Add share functionality to ActivityDetail
- [ ] 8. Add share button to ActivityCard (optional)

## Phase 4: Achievements/Badges System ✅
- [x] 9. Add Achievement types to index.ts
- [x] 10. Create AchievementContext
- [x] 11. Create Achievements page
- [x] 12. Add achievement tracking in ActivityContext
- [x] 13. Update Sidebar with Achievements link

## Phase 5: Certificate of Participation ✅
- [x] 14. Create certificate generation utility (lib/certificate.ts)
- [x] 15. Add "Download Certificate" button to ActivityDetail
- [x] 16. Update routes in App.tsx

## Phase 6: Updates and Integration ✅
- [x] 17. Update Sidebar navigation
- [ ] 18. Test all features

## Summary of Implemented Features:
1. **Photos Gallery** - Upload and view photos from activities (admin feature)
2. **Calendar Integration** - Export to iCal, Google Calendar, Outlook
3. **Activity Sharing** - Copy activity link to clipboard
4. **Achievements/Badges** - Gamification with 10 different badges
5. **Certificate of Participation** - Download PDF certificates for completed activities

