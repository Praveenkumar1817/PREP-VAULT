# Firebase Permission Error - Complete Fix Guide

## 🚨 The Error
```
Error fetching admin analytics data: FirebaseError: Missing or insufficient permissions.
```

## 🔍 Root Cause
Firebase Firestore has security rules that prevent users from reading documents they don't own. By default, users can only access their own data.

## 🛠️ Solutions (Choose One)

### ✅ Solution 1: Update Firebase Security Rules (RECOMMENDED)

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Select project: `prepvault-151105`

2. **Navigate to Firestore:**
   - Click "Firestore Database" → "Rules" tab

3. **Replace existing rules with:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && 
             (request.auth.token.email == 'admin@prepvault.com' ||
              request.auth.token.email == 'praveenkumar1817@gmail.com');
    }
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    match /problems/{problemId} {
      allow read, write: if isAuthenticated() && request.auth.uid == resource.data.user;
      allow read: if isAdmin();
      allow create: if isAuthenticated() && request.auth.uid == request.resource.data.user;
    }
    
    match /users/{userId} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
      allow read: if isAdmin();
    }
    
    match /sheets/{sheetId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
  }
}
```

4. **Click "Publish"**

### ⚡ Solution 2: Quick Test Rules (TEMPORARY)
For immediate testing only:
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

## 🧪 Testing & Debugging

### Step 1: Check Admin Status
Visit: `http://localhost:5173/admin/debug`
This will show:
- Current user email
- Admin status
- Authentication state

### Step 2: Verify Admin Email
Ensure you're using one of these admin emails:
- `admin@prepvault.com`
- `praveenkumar1817@gmail.com`

### Step 3: Test Admin Login
1. Go to `/admin/login`
2. Login with admin credentials
3. Should redirect to `/admin/analytics`

## 🔧 Code Changes Made

### Enhanced Error Handling:
- Added detailed permission error messages
- Added links to Firebase console
- Added step-by-step fix instructions

### Authentication Checks:
- Verify user is logged in before fetching data
- Check admin status before making requests
- Better loading states and error boundaries

### Debug Tools:
- Created `/admin/debug` route for troubleshooting
- Shows current user and admin status
- Helps identify authentication issues

## 📋 Checklist

- [ ] Update Firebase security rules
- [ ] Create admin account in Firebase Auth
- [ ] Test admin login at `/admin/login`
- [ ] Verify admin status at `/admin/debug`
- [ ] Access admin analytics at `/admin/analytics`

## 🚀 Next Steps

1. **Update Firebase rules** (most important)
2. **Create admin account** if not exists
3. **Test the flow**:
   - Login → Debug page → Analytics
4. **Remove debug route** once everything works

## 💡 Pro Tips

- Use Firebase Rules Playground to test rules
- Clear browser cache if issues persist
- Check Firebase Console logs for detailed errors
- Consider using Firebase Functions for complex admin operations

## 🆘 Still Having Issues?

1. Check browser console for detailed errors
2. Verify Firebase project configuration
3. Ensure admin email is correctly spelled
4. Try incognito mode to clear cache issues

The admin dashboard should work perfectly after updating the Firebase rules! 🎉