# Firestore Index Setup

## Required Index for Group Messages

The Group Chat feature requires a composite index in Firestore. 

### Quick Setup

Click this link to create the index automatically:
https://console.firebase.google.com/v1/r/project/campus-connect-sistc/firestore/indexes?create_composite=Clpwcm9qZWN0cy9jYW1wdXMtY29ubmVjdC1zaXN0Yy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZ3JvdXBNZXNzYWdlcy9pbmRleGVzL18QARoLCgdncm91cElkEAEaDQoJdGltZXN0YW1wEAEaDAoIX19uYW1lX18QAQ

### Manual Setup

If the link doesn't work, follow these steps:

1. Go to [Firebase Console](https://console.firebase.google.com/project/campus-connect-sistc/firestore/indexes)
2. Click "Create Index"
3. Set the following:
   - **Collection ID**: `groupMessages`
   - **Fields to index**:
     - `groupId` (Ascending)
     - `timestamp` (Ascending)
   - **Query scope**: Collection
4. Click "Create"

### What This Index Does

This index allows efficient querying of group messages by:
- Filtering messages by `groupId`
- Sorting by `timestamp` in ascending order

Without this index, the query will fail with a `failed-precondition` error. The app will automatically fall back to a simpler query, but performance may be slower.

### Note

The index creation may take a few minutes. Once created, group messages will load faster and more reliably.

