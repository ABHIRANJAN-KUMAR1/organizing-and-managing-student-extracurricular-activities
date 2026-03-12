# Rating Storage Fix - TODO

**Status: 0/3**

### 1. [x] Fix ActivityContext.addRating (Optimistic) ✅
   - Like addActivity: optimistic update → API → reload
   - Edit client/context/ActivityContext.tsx

### 2. [x] Add AdminDashboard refresh ✅
   - Button "Refresh Data" → call context reload
   - Edit client/pages/AdminDashboard.tsx

### 3. [x] Test ✅
   - Student → ActivityDetail → Rate → **AdminDashboard refresh → Shows ratings**
   - Student → ActivityDetail → Rate
   - AdminDashboard → See rating immediately

**Next**: Step 1 → Context fix

