# Debug Guide: Unknown User Issue

## Issue Analysis
The leaderboard shows "Praveenkumar" as the name but "Unknown User" as the email, which indicates:

1. **Profile exists** with the name "Praveenkumar"
2. **Email mismatch** between profile and problem records
3. **Data inconsistency** in the database

## Immediate Debugging Steps

### 1. Check Browser Console
Open browser dev tools (F12) and look for debug logs showing:
- User profile data
- Problem data
- Data inconsistencies

### 2. Check Firebase Console
Go to Firebase Console → Firestore Database and verify:

#### Users Collection (`/users/{userId}`):
```javascript
{
  uid: "your_user_id",
  email: "praveenkumar1817@gmail.com",  // Should match auth email
  name: "Praveenkumar",
  // ... other fields
}
```

#### Problems Collection (`/problems/{problemId}`):
```javascript
{
  user: "your_user_id",              // Should match user document ID
  userEmail: "praveenkumar1817@gmail.com",  // Should match auth email
  // ... other fields
}
```

## Potential Fixes

### Fix 1: Update Existing Profile
If your profile exists but email is missing:

1. Go to `/profile` page
2. Save your profile again (this will update the email field)
3. Check leaderboard again

### Fix 2: Manual Database Fix
In Firebase Console:

1. Find your user document in `/users` collection
2. Ensure `email` field matches your authentication email
3. Update if necessary

### Fix 3: Update Problem Records
If problems don't have `userEmail` field:

1. Find your problems in `/problems` collection
2. Add `userEmail` field with your actual email
3. Or delete and recreate problems

## Root Cause Solutions

### When Creating New Problems
Ensure problems are created with:
```javascript
{
  user: currentUser.uid,
  userEmail: currentUser.email,  // This might be missing
  // ... other problem data
}
```

### When Creating/Updating Profile
Ensure profiles are created with:
```javascript
{
  uid: currentUser.uid,
  email: currentUser.email,  // This should always be set
  name: "Your Name",
  // ... other profile data
}
```

## Quick Test
1. Log out and log back in
2. Go to `/admin/debug` to check your authentication status
3. Complete your profile at `/profile`
4. Check leaderboard again

The debug logs I added will help identify exactly where the data mismatch is occurring!