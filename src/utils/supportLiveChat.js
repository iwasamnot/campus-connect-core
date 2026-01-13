import { collection, query, where, limit, getDocs } from 'firebase/firestore';

const SUPPORT_CHAT_FLAG_KEY = 'openSupportLiveChatAfterLogin';

/**
 * Find any admin user document we can route support chats to.
 * Prefer role === 'admin', then fallback to role === 'admin1'.
 */
export async function findSupportAdminUser(db) {
  if (!db) return null;

  const rolesToTry = ['admin', 'admin1'];
  for (const role of rolesToTry) {
    const q = query(collection(db, 'users'), where('role', '==', role), limit(1));
    const snap = await getDocs(q);
    const docSnap = snap.docs[0];
    if (docSnap) {
      return { id: docSnap.id, ...docSnap.data() };
    }
  }

  return null;
}

/**
 * PrivateChat can auto-open a conversation when these keys are set.
 */
export function setInitialPrivateChatUser(userId, userData) {
  if (typeof sessionStorage === 'undefined') return;
  if (!userId) return;

  sessionStorage.setItem('initialPrivateChatUserId', userId);
  if (userData) {
    try {
      sessionStorage.setItem('initialPrivateChatUserData', JSON.stringify({ id: userId, ...userData }));
    } catch {
      // ignore serialization failures
    }
  }
}

/**
 * Used on the Login screen: user clicks "Live Chat", then after auth we auto-open
 * private chat and preselect an admin.
 */
export function markOpenSupportLiveChatAfterLogin() {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(SUPPORT_CHAT_FLAG_KEY, '1');
}

export function consumeOpenSupportLiveChatAfterLogin() {
  if (typeof sessionStorage === 'undefined') return false;
  const flag = sessionStorage.getItem(SUPPORT_CHAT_FLAG_KEY) === '1';
  if (flag) sessionStorage.removeItem(SUPPORT_CHAT_FLAG_KEY);
  return flag;
}

