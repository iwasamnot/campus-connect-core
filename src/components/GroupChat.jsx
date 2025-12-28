import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isAdminRole, isUserOnline } from '../utils/helpers';
import { 
  collection, 
  addDoc, 
  query, 
  where,
  orderBy, 
  onSnapshot,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs,
  arrayRemove,
  arrayUnion,
  limit
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Send, Trash2, Edit2, X, Check, ArrowLeft, Users, UserMinus, LogOut, Loader } from 'lucide-react';
import UserProfilePopup from './UserProfilePopup';
import { checkToxicity } from '../utils/toxicityChecker';

const GroupChat = ({ group, onBack, setActiveView }) => {
  const { user, userRole } = useAuth();
  const { success, error: showError } = useToast();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState('');
  const [userNames, setUserNames] = useState({});
  const [userProfiles, setUserProfiles] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [removingMember, setRemovingMember] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [processingRequest, setProcessingRequest] = useState(null);
  const messagesEndRef = useRef(null);

  // Fetch user names, profiles, and online status
  useEffect(() => {
    if (!group?.members) return;

    const q = query(collection(db, 'users'), where('__name__', 'in', group.members));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const names = {};
      const profiles = {};
      const online = {};
      
      snapshot.docs.forEach(doc => {
        const userData = doc.data();
        names[doc.id] = userData.name || userData.email?.split('@')[0] || doc.id.substring(0, 8);
        profiles[doc.id] = userData;
        online[doc.id] = {
          isOnline: userData.isOnline || false,
          lastSeen: userData.lastSeen || null
        };
      });
      
      setUserNames(names);
      setUserProfiles(profiles);
      setOnlineUsers(online);
    }, (error) => {
      // Fallback to individual fetches if 'in' query fails
      const fetchUsers = async () => {
        const names = {};
        const profiles = {};
        const online = {};
        
        for (const userId of group.members) {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              names[userId] = userData.name || userData.email?.split('@')[0] || userId.substring(0, 8);
              profiles[userId] = userData;
              online[userId] = {
                isOnline: userData.isOnline || false,
                lastSeen: userData.lastSeen || null
              };
            }
          } catch (error) {
            console.error('Error fetching user:', error);
          }
        }
        
        setUserNames(names);
        setUserProfiles(profiles);
        setOnlineUsers(online);
      };

      fetchUsers();
    });

    return () => unsubscribe();
  }, [group]);

  // Fetch join requests for group admins
  useEffect(() => {
    if (!group?.id || !user) return;
    if (!group.admins?.includes(user.uid)) return; // Only admins see requests

    const groupRef = doc(db, 'groups', group.id);
    const unsubscribe = onSnapshot(groupRef, (snapshot) => {
      if (snapshot.exists()) {
        const groupData = snapshot.data();
        const requests = groupData.joinRequests || [];
        setJoinRequests(requests);
      }
    });

    return () => unsubscribe();
  }, [group, user]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch messages from Firestore
  useEffect(() => {
    if (!group?.id) return;

    const q = query(
      collection(db, 'groupMessages'),
      where('groupId', '==', group.id),
      orderBy('timestamp', 'asc'),
      limit(50) // Reduced to 50 messages for Spark free plan (was 100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [group?.id]); // Only depend on group.id to prevent unnecessary re-subscriptions

  // Mark messages as read (separate effect to prevent infinite loops)
  // DISABLED by default for Spark free plan - read receipts are expensive
  const processedReadMessagesRef = useRef(new Set());
  const lastReadUpdateRef = useRef(0);
  useEffect(() => {
    if (!user?.uid || !group?.id || messages.length === 0) return;
    
    // Cooldown: only update every 10 seconds
    const now = Date.now();
    if (now - lastReadUpdateRef.current < 10000) return;

    // Debounce read updates to prevent quota exhaustion
    const timeoutId = setTimeout(() => {
      const unreadMessages = messages.filter(message => {
        const readBy = message.readBy || {};
        const isUnread = !readBy[user.uid];
        const notProcessed = !processedReadMessagesRef.current.has(message.id);
        return isUnread && notProcessed;
      });

      // Process only first 3 unread messages at a time (reduced from 5)
      unreadMessages.slice(0, 3).forEach(async (message) => {
        try {
          // Mark as processed immediately to prevent duplicate updates
          processedReadMessagesRef.current.add(message.id);
          
          const readBy = message.readBy || {};
          await updateDoc(doc(db, 'groupMessages', message.id), {
            readBy: {
              ...readBy,
              [user.uid]: serverTimestamp()
            }
          });
        } catch (error) {
          // Remove from processed set on error so it can be retried
          processedReadMessagesRef.current.delete(message.id);
          console.error('Error marking message as read:', error);
        }
      });
      
      // Update last update time
      lastReadUpdateRef.current = Date.now();
    }, 5000); // 5 second delay (increased from 2) to prevent immediate re-triggering

    return () => clearTimeout(timeoutId);
  }, [messages, user?.uid, group?.id]); // Only depend on messages, not on readBy updates

  // Toxicity checking is now handled by the toxicityChecker utility

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    // Check toxicity using Gemini AI (with fallback)
    const toxicityResult = await checkToxicity(newMessage.trim(), true);
    const isToxic = toxicityResult.isToxic;
    const displayText = isToxic ? '[REDACTED BY AI]' : newMessage.trim();

    setSending(true);
    try {
      await addDoc(collection(db, 'groupMessages'), {
        groupId: group.id,
        userId: user.uid,
        userEmail: user.email,
        text: newMessage.trim(),
        displayText: displayText,
        toxic: isToxic,
        toxicityConfidence: toxicityResult.confidence,
        toxicityReason: toxicityResult.reason,
        toxicityMethod: toxicityResult.method,
        isAI: false,
        timestamp: serverTimestamp(),
        readBy: {
          [user.uid]: serverTimestamp() // Sender has seen their own message
        }
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error.code === 'permission-denied'
        ? 'Permission denied. You may not have permission to send messages in this group.'
        : error.code === 'not-found'
        ? 'Group not found. Please try refreshing the page.'
        : error.message || 'Failed to send message. Please try again.';
      showError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    setDeleting(messageId);
    try {
      await deleteDoc(doc(db, 'groupMessages', messageId));
      success('Message deleted successfully.');
    } catch (error) {
      console.error('Error deleting message:', error);
      const errorMessage = error.code === 'permission-denied'
        ? 'Permission denied. You may not have permission to delete this message.'
        : error.message || 'Failed to delete message. Please try again.';
      showError(errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  const handleEditMessage = async (messageId) => {
    if (!editText.trim()) {
      setEditing(null);
      return;
    }

    // Check toxicity using Gemini AI (with fallback)
    const toxicityResult = await checkToxicity(editText.trim(), true);
    const isToxic = toxicityResult.isToxic;
    const displayText = isToxic ? '[REDACTED BY AI]' : editText.trim();

    try {
      await updateDoc(doc(db, 'groupMessages', messageId), {
        text: editText.trim(),
        displayText: displayText,
        toxic: isToxic,
        toxicityConfidence: toxicityResult.confidence,
        toxicityReason: toxicityResult.reason,
        toxicityMethod: toxicityResult.method,
        edited: true,
        editedAt: serverTimestamp()
      });
      setEditing(null);
      setEditText('');
      success('Message updated successfully.');
    } catch (error) {
      console.error('Error editing message:', error);
      const errorMessage = error.code === 'permission-denied'
        ? 'Permission denied. You may not have permission to edit this message.'
        : error.message || 'Failed to edit message. Please try again.';
      showError(errorMessage);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    const date = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getReadReceiptInfo = (message) => {
    if (!message.readBy) return { count: 0, users: [] };
    const readBy = message.readBy;
    const readUserIds = Object.keys(readBy).filter(uid => uid !== message.userId); // Exclude sender
    return {
      count: readUserIds.length,
      users: readUserIds.map(uid => ({
        uid,
        name: userNames[uid] || userProfiles[uid]?.name || 'Unknown',
        timestamp: readBy[uid]
      }))
    };
  };

  const handleRemoveMember = async (memberId) => {
    if (!group?.admins?.includes(user?.uid)) {
      showError('Only group admins can remove members');
      return;
    }

    if (memberId === user?.uid) {
      showError('You cannot remove yourself. Use the leave group option instead.');
      return;
    }

    if (group.admins?.includes(memberId) && group.admins?.length === 1) {
      showError('Cannot remove the last admin. Transfer admin rights first.');
      return;
    }

    if (!confirm(`Are you sure you want to remove ${userNames[memberId] || 'this member'} from the group?`)) {
      return;
    }

    setRemovingMember(memberId);
    try {
      const groupRef = doc(db, 'groups', group.id);
      await updateDoc(groupRef, {
        members: arrayRemove(memberId),
        admins: arrayRemove(memberId), // Also remove from admins if they were an admin
        updatedAt: serverTimestamp()
      });
      success(`${userNames[memberId] || 'Member'} has been removed from the group`);
    } catch (error) {
      console.error('Error removing member:', error);
      const errorMessage = error.code === 'permission-denied'
        ? 'Permission denied. You may not have permission to remove members.'
        : error.message || 'Failed to remove member. Please try again.';
      showError(errorMessage);
    } finally {
      setRemovingMember(null);
    }
  };

  const handleInviteByEmail = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      showError('Please enter an email address');
      return;
    }

    if (!group?.admins?.includes(user?.uid)) {
      showError('Only group admins can invite members');
      return;
    }

    setInviting(true);
    try {
      // Search for user by email
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', inviteEmail.trim().toLowerCase())
      );
      
      const snapshot = await getDocs(usersQuery);
      
      if (snapshot.empty) {
        // Try other email fields
        const altQuery = query(
          collection(db, 'users'),
          where('studentEmail', '==', inviteEmail.trim().toLowerCase())
        );
        const altSnapshot = await getDocs(altQuery);
        
        if (altSnapshot.empty) {
          const personalQuery = query(
            collection(db, 'users'),
            where('personalEmail', '==', inviteEmail.trim().toLowerCase())
          );
          const personalSnapshot = await getDocs(personalQuery);
          
          if (personalSnapshot.empty) {
            showError('User not found. Please check the email address.');
            return;
          }
          
          const userDoc = personalSnapshot.docs[0];
          const userId = userDoc.id;
          
          if (group.members?.includes(userId)) {
            showError('User is already a member of this group');
            return;
          }

          await updateDoc(doc(db, 'groups', group.id), {
            members: arrayUnion(userId),
            joinRequests: arrayRemove(userId), // Remove from requests if they had one
            updatedAt: serverTimestamp()
          });
          
          success('User invited successfully!');
          setInviteEmail('');
          setShowInviteModal(false);
          return;
        }
        
        const userDoc = altSnapshot.docs[0];
        const userId = userDoc.id;
        
        if (group.members?.includes(userId)) {
          showError('User is already a member of this group');
          return;
        }

        await updateDoc(doc(db, 'groups', group.id), {
          members: arrayUnion(userId),
          joinRequests: arrayRemove(userId),
          updatedAt: serverTimestamp()
        });
        
        success('User invited successfully!');
        setInviteEmail('');
        setShowInviteModal(false);
        return;
      }

      const userDoc = snapshot.docs[0];
      const userId = userDoc.id;
      
      if (group.members?.includes(userId)) {
        showError('User is already a member of this group');
        return;
      }

      await updateDoc(doc(db, 'groups', group.id), {
        members: arrayUnion(userId),
        joinRequests: arrayRemove(userId), // Remove from requests if they had one
        updatedAt: serverTimestamp()
      });
      
      success('User invited successfully!');
      setInviteEmail('');
      setShowInviteModal(false);
    } catch (error) {
      console.error('Error inviting user:', error);
      const errorMessage = error.code === 'permission-denied'
        ? 'Permission denied. You may not have permission to invite users.'
        : error.message || 'Failed to invite user. Please try again.';
      showError(errorMessage);
    } finally {
      setInviting(false);
    }
  };

  const handleApproveRequest = async (userId) => {
    if (!group?.admins?.includes(user?.uid)) {
      showError('Only group admins can approve requests');
      return;
    }

    setProcessingRequest(userId);
    try {
      await updateDoc(doc(db, 'groups', group.id), {
        members: arrayUnion(userId),
        joinRequests: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });
      success('Join request approved!');
    } catch (error) {
      console.error('Error approving request:', error);
      const errorMessage = error.code === 'permission-denied'
        ? 'Permission denied. You may not have permission to approve requests.'
        : error.message || 'Failed to approve request. Please try again.';
      showError(errorMessage);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDenyRequest = async (userId) => {
    if (!group?.admins?.includes(user?.uid)) {
      showError('Only group admins can deny requests');
      return;
    }

    setProcessingRequest(userId);
    try {
      await updateDoc(doc(db, 'groups', group.id), {
        joinRequests: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });
      success('Join request denied');
    } catch (error) {
      console.error('Error denying request:', error);
      const errorMessage = error.code === 'permission-denied'
        ? 'Permission denied. You may not have permission to deny requests.'
        : error.message || 'Failed to deny request. Please try again.';
      showError(errorMessage);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm(`Are you sure you want to leave "${group.name}"?`)) {
      return;
    }

    try {
      const groupRef = doc(db, 'groups', group.id);
      const groupSnap = await getDoc(groupRef);
      
      if (!groupSnap.exists()) {
        showError('Group not found');
        return;
      }

      const groupData = groupSnap.data();
      
      // If user is the only admin, delete the group
      if (groupData.admins?.length === 1 && groupData.admins[0] === user.uid) {
        await deleteDoc(groupRef);
        success('Group deleted successfully');
        onBack();
      } else {
        // Remove from members and admins
        await updateDoc(groupRef, {
          members: arrayRemove(user.uid),
          admins: arrayRemove(user.uid),
          updatedAt: serverTimestamp()
        });
        success('Left group successfully');
        onBack();
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      const errorMessage = error.code === 'permission-denied'
        ? 'Permission denied. You may not have permission to leave this group.'
        : error.message || 'Failed to leave group. Please try again.';
      showError(errorMessage);
    }
  };

  if (!group) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-400">No group selected</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-700 rounded-lg transition-colors"
              title="Back to groups"
            >
              <ArrowLeft size={20} className="text-indigo-600 dark:text-indigo-400" />
            </button>
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white truncate">{group.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {group.members?.length || 0} member(s)
                {group.admins?.includes(user?.uid) && (
                  <span className="ml-2 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                    Admin
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {group.admins?.includes(user?.uid) && joinRequests.length > 0 && (
              <button
                onClick={() => setShowRequestsModal(true)}
                className="relative p-2 hover:bg-indigo-100 dark:hover:bg-indigo-700 rounded-lg transition-colors"
                title="View join requests"
              >
                <UserPlus size={20} className="text-indigo-600 dark:text-indigo-400" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {joinRequests.length}
                </span>
              </button>
            )}
            <button
              onClick={() => setShowMembersModal(true)}
              className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-700 rounded-lg transition-colors"
              title="View members"
            >
              <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
            </button>
            {group.admins?.includes(user?.uid) && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="p-2 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors"
                title="Invite by email"
              >
                <Mail size={20} className="text-green-600 dark:text-green-400" />
              </button>
            )}
            {!group.admins?.includes(user?.uid) && (
              <button
                onClick={handleLeaveGroup}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                title="Leave group"
              >
                <LogOut size={20} className="text-red-600 dark:text-red-400" />
              </button>
            )}
          </div>
        </div>
        {group.description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{group.description}</p>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 md:px-6 py-3 md:py-4 space-y-3 md:space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <img 
              src="/logo.png" 
              alt="CampusConnect Logo" 
              className="w-24 h-24 mb-4 opacity-50 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <p className="text-gray-400 dark:text-gray-500 text-center">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isAuthor = message.userId === user?.uid;
            const isAdmin = isAdminRole(userRole);
            const canEdit = isAuthor && !message.edited;
            const canDelete = isAuthor || isAdmin;
            const userProfile = userProfiles[message.userId] || {};
            const profilePicture = userProfile.profilePicture;

            return (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${
                  isAuthor ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Profile Picture - Only show for other users */}
                {!isAuthor && (
                  <button
                    onClick={() => setSelectedUserId(message.userId)}
                    className="flex-shrink-0 mt-1"
                  >
                    {profilePicture ? (
                      <img 
                        src={profilePicture} 
                        alt={userNames[message.userId] || 'User'} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors ${profilePicture ? 'hidden' : ''}`}
                    >
                      <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </button>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 md:px-4 py-2 rounded-lg relative group ${
                    isAuthor
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedUserId(message.userId)}
                        className="text-xs font-medium opacity-90 hover:underline cursor-pointer"
                        title={
                          isUserOnline(onlineUsers[message.userId])
                            ? 'Online'
                            : onlineUsers[message.userId]?.lastSeen
                            ? `Last seen: ${formatLastSeen(onlineUsers[message.userId].lastSeen)}`
                            : 'Offline'
                        }
                      >
                        {userNames[message.userId] || message.userEmail?.split('@')[0] || 'Unknown'}
                      </button>
                      {isUserOnline(onlineUsers[message.userId]) ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Online" />
                      ) : onlineUsers[message.userId]?.lastSeen ? (
                        <div className="w-2 h-2 bg-gray-400 rounded-full" title={`Last seen: ${formatLastSeen(onlineUsers[message.userId].lastSeen)}`} />
                      ) : null}
                    </div>
                    <div className="text-xs opacity-75 ml-2">
                      {formatTimestamp(message.timestamp)}
                      {message.edited && <span className="ml-1 italic">(edited)</span>}
                    </div>
                  </div>
                  
                  {editing === message.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-2 py-1 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditMessage(message.id);
                          } else if (e.key === 'Escape') {
                            setEditing(null);
                            setEditText('');
                          }
                        }}
                      />
                      <button
                        onClick={() => handleEditMessage(message.id)}
                        className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditing(null);
                          setEditText('');
                        }}
                        className="p-1 bg-red-600 hover:bg-red-700 text-white rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm">
                        {message.displayText || message.text}
                      </div>
                      {message.edited && (
                        <div className="text-xs mt-1 opacity-75 italic">
                          (edited)
                        </div>
                      )}
                      {message.toxic && (
                        <div className="text-xs mt-1 opacity-75 italic">
                          ⚠️ Flagged by AI
                        </div>
                      )}
                      
                      {/* Read Receipts */}
                      {isAuthor && message.readBy && (() => {
                        const readInfo = getReadReceiptInfo(message);
                        if (readInfo.count > 0) {
                          return (
                            <div className="text-xs mt-1 opacity-60 flex items-center gap-1">
                              <span>Seen by {readInfo.count}</span>
                              <div className="relative group/read">
                                <span className="cursor-help">👁️</span>
                                <div className="absolute bottom-full right-0 mb-2 hidden group-hover/read:block bg-gray-800 dark:bg-gray-900 text-white text-xs rounded-lg p-2 shadow-lg z-10 min-w-[150px]">
                                  <div className="font-semibold mb-1">Seen by:</div>
                                  {readInfo.users.map((readUser, idx) => (
                                    <div key={readUser.uid} className="py-1">
                                      {readUser.name} - {formatTimestamp(readUser.timestamp)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}

                  {/* Action buttons */}
                  <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {canEdit && (
                      <button
                        onClick={() => {
                          setEditing(message.id);
                          setEditText(message.text);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-1 rounded-full"
                        title="Edit message"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        disabled={deleting === message.id}
                        className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete message"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-3 md:px-6 py-3 md:py-4">
        <form onSubmit={sendMessage} className="flex gap-2 md:gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 md:px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2"
          >
            <Send size={18} className="md:w-5 md:h-5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>

      {/* User Profile Popup */}
      {selectedUserId && (
        <UserProfilePopup 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)}
          onStartPrivateChat={(userId, userData) => {
            if (setActiveView) {
              sessionStorage.setItem('initialPrivateChatUserId', userId);
              setActiveView('private-chat');
            }
          }}
        />
      )}

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowMembersModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Group Members</h3>
              <button
                onClick={() => setShowMembersModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {group.members && group.members.length > 0 ? (
                <div className="space-y-2">
                  {group.members.map((memberId) => {
                    const isAdmin = group.admins?.includes(memberId);
                    const isCurrentUser = memberId === user?.uid;
                    const isCurrentUserAdmin = group.admins?.includes(user?.uid);
                    const canRemove = isCurrentUserAdmin && !isCurrentUser && (isAdmin ? group.admins?.length > 1 : true);
                    const memberName = userNames[memberId] || 'Unknown User';
                    const memberProfile = userProfiles[memberId] || {};
                    const memberOnline = isUserOnline(onlineUsers[memberId]) || false;

                    return (
                      <div
                        key={memberId}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {memberProfile.profilePicture ? (
                            <img
                              src={memberProfile.profilePicture}
                              alt={memberName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 ${memberProfile.profilePicture ? 'hidden' : ''}`}>
                            <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-800 dark:text-white truncate">
                                {memberName}
                                {isCurrentUser && ' (You)'}
                              </p>
                              {isAdmin && (
                                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium flex-shrink-0">
                                  Admin
                                </span>
                              )}
                              {memberOnline && (
                                <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" title="Online" />
                              )}
                            </div>
                            {memberProfile.email && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {memberProfile.email}
                              </p>
                            )}
                          </div>
                        </div>
                        {canRemove && (
                          <button
                            onClick={() => handleRemoveMember(memberId)}
                            disabled={removingMember === memberId}
                            className="ml-2 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove member"
                          >
                            {removingMember === memberId ? (
                              <Loader className="animate-spin" size={18} />
                            ) : (
                              <UserMinus size={18} />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No members found</p>
              )}
            </div>
            {!group.admins?.includes(user?.uid) && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowMembersModal(false);
                    handleLeaveGroup();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  <span>Leave Group</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChat;

