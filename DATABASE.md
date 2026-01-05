# 🔥 Firebase Firestore Database Structure

## Collections Overview

### 1. `users` Collection
Stores user profiles and account information.

```javascript
{
  uid: string,              // Firebase Auth UID
  name: string,             // Full name
  email: string,            // Email address
  phone: string | null,     // Phone number (optional)
  role: string,             // "student", "teacher", "admin"
  approved: boolean,        // For teacher approval
  photoURL: string | null,  // Profile picture URL
  createdAt: timestamp,
  
  // Student-specific fields
  grade: string,            // "1", "2", "3", etc.
  section: string,          // "A", "B", "C"
  points: number,           // Reward points
  
  // Teacher-specific fields
  subject: string           // Teaching subject
}
```

### 2. `puppets` Collection
Manages the puppet inventory (30+ puppets).

```javascript
{
  id: string,
  name: string,             // Puppet name (e.g., "الأسد الشجاع")
  type: string,             // "animal", "family", "character"
  description: string,      // Brief description
  imageUrl: string,         // Image URL from Storage
  tags: array,              // ["حيوان", "غابة", etc.]
  dateAdded: timestamp,
  usageCount: number,       // How many times used
  available: boolean        // Currently available for booking
}
```

### 3. `stories` Collection
Student-created scenarios and scripts.

```javascript
{
  id: string,
  title: string,
  author: string,           // User UID
  stemTopic: string,        // "science", "math", "engineering", "technology"
  stemConcept: string,      // Specific concept (e.g., "دورة المياه")
  description: string,
  scenes: [
    {
      sceneNumber: number,
      description: string,
      dialogues: [
        {
          character: string,
          puppetId: string,
          text: string
        }
      ]
    }
  ],
  puppetsUsed: array,       // Array of puppet IDs
  status: string,           // "draft", "published", "approved"
  createdAt: timestamp,
  updatedAt: timestamp,
  rating: number,
  views: number
}
```

### 4. `productions` Collection
Recorded puppet shows/performances.

```javascript
{
  id: string,
  title: string,
  storyId: string,          // Reference to story
  students: array,          // Array of student UIDs
  videoUrl: string,         // Video URL from Storage
  thumbnailUrl: string,     // Thumbnail image URL
  description: string,
  puppetsUsed: array,       // Array of puppet IDs
  stemTopic: string,
  uploadDate: timestamp,
  rating: number,
  views: number,
  approved: boolean
}
```

**Subcollection:** `productions/{id}/comments`
```javascript
{
  userId: string,
  userName: string,
  text: string,
  date: timestamp
}
```

### 5. `challenges` Collection
Weekly/monthly STEM challenges.

```javascript
{
  id: string,
  title: string,
  description: string,
  stemTopic: string,
  startDate: timestamp,
  endDate: timestamp,
  points: number,           // Reward points
  status: string,           // "active", "completed", "upcoming"
  createdBy: string,        // Teacher/Admin UID
  participants: array       // Array of student UIDs
}
```

### 6. `achievements` Collection
Student achievements and progress tracking.

```javascript
{
  userId: string,
  achievements: [
    {
      type: string,         // "first_story", "video_upload", etc.
      title: string,
      description: string,
      earnedAt: timestamp,
      points: number
    }
  ],
  totalPoints: number,
  level: number,
  badges: array
}
```

---

## Firebase Storage Structure

```
/puppets
  /{puppetId}.jpg         // Puppet images
  
/productions
  /{productionId}
    /video.mp4            // Video file
    /thumbnail.jpg        // Thumbnail
    
/users
  /{userId}
    /profile.jpg          // Profile pictures
```

---

## Initial Setup Steps

### 1. Enable Authentication
- Go to Firebase Console → Authentication
- Enable Email/Password sign-in
- Enable Google sign-in (optional)

### 2. Create Firestore Database
- Go to Firebase Console → Firestore Database
- Create database in production mode
- Deploy the security rules from `firestore.rules`

### 3. Enable Storage
- Go to Firebase Console → Storage
- Set up storage bucket
- Configure CORS for web access

### 4. Create First Admin User
Run this in Firebase Console:
```javascript
// After registering via the app, manually set admin role
db.collection('users').doc('USER_UID_HERE').update({
  role: 'admin',
  approved: true
});
```

### 5. Add Sample Puppets
You can add initial puppets via the admin dashboard once logged in as admin.

---

## Security Rules Deployment

Upload `firestore.rules` to Firebase Console:
1. Go to Firestore Database → Rules
2. Copy content from `firestore.rules`
3. Publish the rules

---

## Indexes Required

Firestore will automatically suggest creating indexes when you first run queries. Common indexes needed:

- `stories`: `author` (asc), `createdAt` (desc)
- `productions`: `students` (array), `uploadDate` (desc)
- `challenges`: `endDate` (asc), `status` (asc)
