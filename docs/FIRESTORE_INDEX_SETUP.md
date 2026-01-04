# Firestore Index Setup

## Required Indexes

The app requires several composite indexes in Firestore for optimal performance.

### 1. Index for Group Messages

The Group Chat feature requires a composite index in Firestore. 

**Quick Setup:**
Click this link to create the index automatically:
https://console.firebase.google.com/v1/r/project/campus-connect-sistc/firestore/indexes?create_composite=Clpwcm9qZWN0cy9jYW1wdXMtY29ubmVjdC1zaXN0Yy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZ3JvdXBNZXNzYWdlcy9pbmRleGVzL18QARoLCgdncm91cElkEAEaDQoJdGltZXN0YW1wEAEaDAoIX19uYW1lX18QAQ

**Manual Setup:**
1. Go to [Firebase Console](https://console.firebase.google.com/project/campus-connect-sistc/firestore/indexes)
2. Click "Create Index"
3. Set the following:
   - **Collection ID**: `groupMessages`
   - **Fields to index**:
     - `groupId` (Ascending)
     - `timestamp` (Ascending)
   - **Query scope**: Collection
4. Click "Create"

### 2. Index for Activity Dashboard (Messages by User)

The Activity Dashboard requires an index for querying messages by user and timestamp.

**Quick Setup:**
Click this link to create the index automatically:
https://console.firebase.google.com/v1/r/project/campus-connect-sistc/firestore/indexes?create_composite=ClVwcm9qZWN0cy9jYW1wdXMtY29ubmVjdC1zaXN0Yy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbWVzc2FnZXMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaDQoJdGltZXN0YW1wEAIaDAoIX19uYW1lX18QAg

**Manual Setup:**
1. Go to [Firebase Console](https://console.firebase.google.com/project/campus-connect-sistc/firestore/indexes)
2. Click "Create Index"
3. Set the following:
   - **Collection ID**: `messages`
   - **Fields to index**:
     - `userId` (Ascending)
     - `timestamp` (Descending)
   - **Query scope**: Collection
4. Click "Create"

### What These Indexes Do

- **Group Messages Index**: Allows efficient querying of group messages by `groupId` and sorting by `timestamp`
- **Messages Index**: Allows efficient querying of user messages by `userId` and sorting by `timestamp` (for Activity Dashboard)

### Note

- The app will automatically fall back to simpler queries if indexes are missing, but performance may be slower
- Index creation may take a few minutes
- Once created, queries will load faster and more reliably

