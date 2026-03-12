# Persistence Fix TODO

## Approved Plan Steps

**1. [x] Read Students.tsx** - Confirmed: uses localStorage.getItem("users")
**2. [x] Fix Students.tsx** - Now uses usersApi.getAll() → filter students, admin-only, loading/error/refresh
**3. [x] Remove localStorage** from AuthContext.tsx & ActivityContext.tsx - Pure server API sync
**4. [x] Unify Login** - Deleted Login_temp.tsx, Login_new.tsx, Login_backup.tsx, fix_login.js - Clean Login.tsx only
**5. [ ] Test API endpoints** - Verify students/activities persist
**6. [ ] Add** Data Recovery UI in AdminDashboard
**7. [ ] Backend backup** - Add auto-backup in database.ts
**8. [ ] Test** full cycle: add student/activity/checkin -> restart server -> verify data
**9. [ ] Complete** ✅

Progress will be updated after each step.

