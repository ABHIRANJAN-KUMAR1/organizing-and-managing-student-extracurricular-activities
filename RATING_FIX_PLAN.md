# Rating Storage Fix Plan

**Issue**: Ratings given (ActivityDetail → Rating.tsx → Context → API) not persisting in admin dashboard/analytics.

## Info Gathered
- **Rating.tsx**: UI component OK (onRate callback)
- **ActivityDetail.tsx**: `handleSubmitRating` → `addRating` → Context OK
- **ActivityContext.addRating**: POST /api/activities/:id/ratings → getAll() reload OK
- **Server activities.ts**: POST /ratings → update ratings array → **COMPLETE** (res.json sent)
- **AdminDashboard/Analytics**: Use `activities` context → Should see ratings.length/avg
- **FileDB**: Saves OK (JSON persists)

**Root Cause**: Context reload in `addRating` may fail silently (`catch {}`), stale admin views.

## Plan
1. **ActivityContext.tsx**: Add optimistic ratings update like addActivity
2. **Server**: Ensure response consistent
3. **AdminDashboard**: Add manual refresh button for ratings
4. **Test**: Student rates → Admin sees immediately

**Files**:
- client/context/ActivityContext.tsx (optimistic)
- client/pages/AdminDashboard.tsx (refresh)

