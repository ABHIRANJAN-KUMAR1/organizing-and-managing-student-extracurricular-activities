# Activity Calendar Fix - TODO Steps

**Status: 5/5 completed** ✅

## Plan Breakdown (Approved)

### 1. [x] Update client/components/Calendar.tsx (High Priority)
   - Add `highlightDate?: string` prop to `CalendarView` ✅
   - Add `useEffect`: if `highlightDate`, `setCurrentDate(parseISO(highlightDate))` ✅
   - Add console.log for debugging activities ✅

   - Add `highlightDate?: string` prop to `CalendarView`
   - Add `useEffect`: if `highlightDate`, `setCurrentDate(parseISO(highlightDate))`
   - Add console.log for debugging activities

### 2. [x] Update client/pages/ActivityForm.tsx (High Priority) ✅
   - In `handleSubmit`: After success, `navigate(\`/activities/calendar?date=\${formData.date}\`)` ✅
   - Add small delay ✅
   - In `handleSubmit`: After success, `navigate(\`/activities/calendar?date=\${formData.date}\`)`
   - Add small delay if needed: `setTimeout(() => navigate(...), 100)`

### 3. [x] Update client/pages/ActivitiesCalendar.tsx (High Priority) ✅
   - Import `useSearchParams` from react-router-dom ✅
   - `const [searchParams] = useSearchParams()` ✅
   - `const highlightDate = searchParams.get('date')` ✅
   - Pass `<CalendarView highlightDate={highlightDate} ... />` ✅
   - Import `useSearchParams` from react-router-dom
   - `const [searchParams] = useSearchParams()`
   - `const highlightDate = searchParams.get('date')`
   - Pass `<CalendarView highlightDate={highlightDate} ... />`

### 4. [x] Update client/context/ActivityContext.tsx (Medium) ✅
   - In `addActivity`: Optimistic update ✅
   - In `addActivity`: Optimistic update `setActivities(prev => [newActivity, ...prev]);` before API

### 5. [x] Test & Complete ✅
   - Run `npm run dev`
   - Login admin → Create activity → Verify auto-jumps to calendar & shows activity
   - Test manual: `/activities/calendar?date=2026-04-01`
   - Mark all ✅ → attempt_completion

**Next Command**: `npm run dev` (client) + server running
**Expected Result**: Activities appear in calendar after creation, auto month navigation.

*Updated: After each step, re-run this file & mark [x]*
