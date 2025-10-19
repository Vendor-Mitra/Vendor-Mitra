# Firebase Setup Instructions for Vendor Mitra

## Problem
Currently, the app uses localStorage which is browser-specific. Products added on one computer are not visible on another computer because localStorage is not shared across systems.

## Solution
Integrate Firebase Realtime Database or Firestore to sync data across all devices in real-time.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name it "vendor-mitra" or similar
4. Disable Google Analytics (optional)
5. Click "Create Project"

## Step 2: Register Your Web App

1. In Firebase Console, click the web icon (</>) to add a web app
2. Register app with nickname "Vendor Mitra Web"
3. Copy the Firebase configuration object (firebaseConfig)
4. You'll need these values for the next step

## Step 3: Enable Firestore Database

1. In Firebase Console, go to "Build" → "Firestore Database"
2. Click "Create Database"
3. Choose "Start in test mode" (for development)
4. Select a location (choose closest to your users)
5. Click "Enable"

## Step 4: Set Up Authentication (Optional but Recommended)

1. Go to "Build" → "Authentication"
2. Click "Get Started"
3. Enable "Email/Password" provider
4. Click "Save"

## Step 5: Install Firebase in Your Project

Run this command in your project directory:

```bash
npm install firebase
```

## Step 6: Create Firebase Configuration File

Create a new file: `src/config/firebase.js` with your Firebase config:

```javascript
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
export const db = getFirestore(app)

// Initialize Auth
export const auth = getAuth(app)

export default app
```

## Step 7: Update Firestore Security Rules

In Firebase Console → Firestore Database → Rules, update to:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // For testing, you can temporarily allow all (NOT for production):
    // match /{document=**} {
    //   allow read, write: if true;
    // }
  }
}
```

## Step 8: Test the Integration

After implementing the Firebase service (see FIREBASE_INTEGRATION.md), test:

1. Add a product on Computer A
2. Open the app on Computer B
3. The product should appear automatically
4. Delete/update on either computer should sync instantly

## Important Notes

- **Test Mode**: Current rules allow all access for 30 days. Update rules before production!
- **API Keys**: Firebase API keys are safe to expose in client code (they're restricted by domain)
- **Costs**: Firebase free tier includes:
  - 50K reads/day
  - 20K writes/day
  - 1GB storage
  - 10GB/month bandwidth

## Next Steps

After completing these steps, I'll update the productApi.js to use Firebase instead of localStorage.
