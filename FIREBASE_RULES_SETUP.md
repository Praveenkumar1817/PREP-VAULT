# Firebase Security Rules Setup Guide

## Issue: Missing or insufficient permissions

You're getting this error because Firebase Firestore has default security rules that prevent reading other users' documents. Here are the solutions:

## Solution 1: Update Firestore Security Rules (Recommended)

1. **Go to Firebase Console**: 
   - Visit https://console.firebase.google.com/
   - Select your project: `prepvault-151105`

2. **Navigate to Firestore Database**:
   - Click on "Firestore Database" in the left sidebar
   - Click on "Rules" tab

3. **Update the rules** with the content from `firestore.rules` file I created:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             (request.auth.token.email == 'admin@prepvault.com' ||
              request.auth.token.email == 'praveenkumar1817@gmail.com');
    }
    
    // Function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Problems collection rules
    match /problems/{problemId} {
      // Users can read and write their own problems
      allow read, write: if isAuthenticated() && request.auth.uid == resource.data.user;
      // Admins can read all problems
      allow read: if isAdmin();
      // Allow creation if user is authenticated and setting their own uid
      allow create: if isAuthenticated() && request.auth.uid == request.resource.data.user;
    }
    
    // Users collection rules (if you have one)
    match /users/{userId} {
      // Users can read and write their own data
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
      // Admins can read all user data
      allow read: if isAdmin();
    }
    
    // Sheets collection rules (if you have one)
    match /sheets/{sheetId} {
      // Allow read access to authenticated users
      allow read: if isAuthenticated();
      // Allow write access to admins
      allow write: if isAdmin();
    }
    
    // Default rule for other collections - restrict access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

4. **Publish the rules** by clicking "Publish"

## Solution 2: Temporary Development Rules (Quick Fix)

If you want to test quickly, you can temporarily use these permissive rules (NOT recommended for production):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Solution 3: Alternative Data Structure

If you prefer not to change security rules, you could:

1. Create a separate `analytics` collection that aggregates data
2. Use Firebase Functions to periodically update analytics data
3. Store user summaries in a way that admins can access

## Important Security Notes:

- The recommended rules only allow admins (specific emails) to read all data
- Regular users can only access their own data
- Always test your rules before deploying to production
- Consider using Firebase Security Rules Playground to test rules

## After Updating Rules:

1. Clear your browser cache
2. Refresh the application
3. Try logging in with admin credentials again

The admin analytics should now work properly! 🎉