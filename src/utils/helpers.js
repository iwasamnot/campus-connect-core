// Helper function to check if a role is admin (supports both 'admin' and 'admin1')
export const isAdminRole = (role) => {
  return role === 'admin' || role === 'admin1';
};

// Helper function to check if a user is actually online
// A user is considered online if:
// 1. isOnline flag is true AND
// 2. lastSeen is within the last 5 minutes
export const isUserOnline = (userData) => {
  if (!userData) return false;
  
  // Check isOnline flag
  const hasOnlineFlag = userData.isOnline === true || userData.isOnline === 'true';
  if (!hasOnlineFlag) return false;
  
  // Check if lastSeen is recent (within 5 minutes)
  if (!userData.lastSeen) return false;
  
  const lastSeenTime = userData.lastSeen?.toDate?.() || (userData.lastSeen ? new Date(userData.lastSeen) : null);
  if (!lastSeenTime) return false;
  
  const timeSinceLastSeen = Date.now() - lastSeenTime.getTime();
  const ONLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  return timeSinceLastSeen < ONLINE_THRESHOLD;
};


