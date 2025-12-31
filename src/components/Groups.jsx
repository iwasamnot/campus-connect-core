import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  limit,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Users, Plus, Search, X, Loader, Globe, UserPlus, Mail, CheckCircle, XCircle } from 'lucide-react';

const Groups = ({ setActiveView, setSelectedGroup }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [groups, setGroups] = useState([]);
  const [allGroups, setAllGroups] = useState([]); // All groups for browsing
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [browseSearchTerm, setBrowseSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);
  const [requesting, setRequesting] = useState(null);

  // Fetch groups user is a member of
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    
    // Use query with where clause for members
    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', user.uid),
      limit(50) // Limit to 50 groups to prevent quota exhaustion
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const groupsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGroups(groupsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching groups:', error);
        // Show user-friendly error message
        if (error.code === 'failed-precondition') {
          showError('Groups index is missing. Please create a Firestore index for groups.members or contact support.');
          // Fallback: try fetching all groups and filter client-side
          const fallbackQ = query(collection(db, 'groups'), limit(50));
          const fallbackUnsubscribe = onSnapshot(
            fallbackQ,
            (fallbackSnapshot) => {
              const allGroups = fallbackSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              const filteredGroups = allGroups.filter(group => group.members?.includes(user.uid));
              setGroups(filteredGroups);
              setLoading(false);
            },
            (fallbackError) => {
              console.error('Error with fallback query:', fallbackError);
              showError('Failed to load groups. Please try again.');
              setLoading(false);
            }
          );
          return () => fallbackUnsubscribe();
        } else if (error.code === 'permission-denied') {
          showError('Permission denied. You may not have permission to view groups.');
        } else {
          showError('Failed to load groups. Please try again.');
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, showError]);

  // Fetch all groups for browsing (when modal is open)
  useEffect(() => {
    if (!user || !showBrowseModal) {
      setAllGroups([]);
      return;
    }

    console.log('Groups: Fetching all groups for browsing');
    const q = query(
      collection(db, 'groups'),
      limit(50) // Limit to 50 groups to prevent quota exhaustion
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('Groups: Fetched', snapshot.docs.length, 'groups');
        const groupsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllGroups(groupsData);
      },
      (error) => {
        console.error('Error fetching all groups:', error);
        if (error.code === 'permission-denied') {
          showError('Permission denied. You may not have permission to browse groups.');
        } else {
          showError('Failed to load groups. Please try again.');
        }
        setAllGroups([]);
      }
    );

    return () => unsubscribe();
  }, [user, showBrowseModal, showError]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      showError('Please enter a group name');
      return;
    }

    setCreating(true);
    try {
      await addDoc(collection(db, 'groups'), {
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || null,
        createdBy: user.uid,
        createdByEmail: user.email,
        members: [user.uid],
        admins: [user.uid], // Creator is automatically admin
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      success('Group created successfully!');
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
    } catch (error) {
      console.error('Error creating group:', error);
      const errorMessage = error.code === 'permission-denied'
        ? 'Permission denied. You may not have permission to create groups.'
        : error.message || 'Failed to create group. Please try again.';
      showError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleLeaveGroup = async (groupId, groupName) => {
    if (!confirm(`Are you sure you want to leave "${groupName}"?`)) return;

    try {
      const groupRef = doc(db, 'groups', groupId);
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
      } else {
        // Remove from members and admins
        await updateDoc(groupRef, {
          members: arrayRemove(user.uid),
          admins: arrayRemove(user.uid),
          updatedAt: serverTimestamp()
        });
        success('Left group successfully');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      const errorMessage = error.code === 'permission-denied'
        ? 'Permission denied. You may not have permission to leave this group.'
        : error.message || 'Failed to leave group. Please try again.';
      showError(errorMessage);
    }
  };

  const handleRequestToJoin = async (groupId) => {
    if (!user) return;

    setRequesting(groupId);
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupSnap = await getDoc(groupRef);
      
      if (!groupSnap.exists()) {
        showError('Group not found');
        return;
      }

      const groupData = groupSnap.data();
      
      // Check if already a member
      if (groupData.members?.includes(user.uid)) {
        showError('You are already a member of this group');
        return;
      }

      // Check if already requested
      const joinRequests = groupData.joinRequests || [];
      if (joinRequests.includes(user.uid)) {
        showError('You have already requested to join this group');
        return;
      }

      // Add join request
      await updateDoc(groupRef, {
        joinRequests: arrayUnion(user.uid),
        updatedAt: serverTimestamp()
      });

      success('Join request sent! The group admin will review it.');
    } catch (error) {
      console.error('Error requesting to join:', error);
      const errorMessage = error.code === 'permission-denied'
        ? 'Permission denied. You may not have permission to request to join this group.'
        : error.message || 'Failed to send join request. Please try again.';
      showError(errorMessage);
    } finally {
      setRequesting(null);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBrowseGroups = allGroups.filter(group => {
    const matchesSearch = !browseSearchTerm || 
                         group.name?.toLowerCase().includes(browseSearchTerm.toLowerCase()) ||
                         group.description?.toLowerCase().includes(browseSearchTerm.toLowerCase());
    return matchesSearch;
  }).sort((a, b) => {
    // Sort: non-members first, then by member count (descending)
    const aIsMember = a.members?.includes(user?.uid);
    const bIsMember = b.members?.includes(user?.uid);
    if (aIsMember !== bIsMember) {
      return aIsMember ? 1 : -1;
    }
    return (b.members?.length || 0) - (a.members?.length || 0);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader className="animate-spin mx-auto text-indigo-600 mb-4" size={48} />
          <p className="text-gray-600 dark:text-gray-400">Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div 
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4"
        style={{
          paddingTop: `max(1rem, env(safe-area-inset-top, 0px) + 0.5rem)`,
          paddingBottom: `1rem`,
          paddingLeft: `calc(1.5rem + env(safe-area-inset-left, 0px))`,
          paddingRight: `calc(1.5rem + env(safe-area-inset-right, 0px))`,
          position: 'relative',
          zIndex: 10
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white">Groups</h2>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Create and join study groups</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBrowseModal(true)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
            >
              <Globe size={18} />
              <span className="hidden sm:inline">Browse Groups</span>
              <span className="sm:hidden">Browse</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Create Group</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div 
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 md:py-4"
        style={{
          paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
          paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`,
          position: 'relative',
          zIndex: 5
        }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <label htmlFor="groups-search" className="sr-only">Search groups</label>
          <input
            type="text"
            id="groups-search"
            name="groups-search"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      </div>

      {/* Groups List */}
      <div 
        className="flex-1 overflow-y-auto px-3 md:px-6 py-3 md:py-4 overscroll-contain touch-pan-y -webkit-overflow-scrolling-touch"
        style={{
          paddingLeft: `calc(0.75rem + env(safe-area-inset-left, 0px))`,
          paddingRight: `calc(0.75rem + env(safe-area-inset-right, 0px))`,
          paddingBottom: `calc(0.5rem + env(safe-area-inset-bottom, 0px) * 0.5)`
        }}
      >
        {filteredGroups.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-fade-in">
              <img 
                src="/logo.png" 
                alt="CampusConnect Logo" 
                className="w-24 h-24 mx-auto mb-4 opacity-50 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = e.target.nextElementSibling;
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <Users className="mx-auto text-gray-400 dark:text-gray-500 mb-4 hidden" size={48} />
              <p className="text-gray-400 dark:text-gray-500 text-lg">
                {searchTerm ? 'No groups found matching your search' : 'No groups yet. Create or join one!'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedGroup(group);
                  setActiveView('group-chat');
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {group.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLeaveGroup(group.id, group.name);
                    }}
                    className="ml-2 p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Leave group"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    {group.admins?.includes(user.uid) && (
                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                        Admin
                      </span>
                    )}
                  </span>
                  <span>{group.members?.length || 0} member(s)</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4"
          style={{
            paddingTop: `calc(1rem + env(safe-area-inset-top, 0px))`,
            paddingBottom: `calc(0.25rem + env(safe-area-inset-bottom, 0px) * 0.3)`,
            paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
            paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto overscroll-contain" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Create New Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  id="group-name"
                  name="groupName"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  disabled={creating}
                />
              </div>
              <div>
                <label htmlFor="group-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  id="group-description"
                  name="groupDescription"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="Enter group description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-none"
                  disabled={creating}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={20} />
                      <span>Create Group</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="px-6 py-3 border-2 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 font-semibold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Browse Groups Modal */}
      {showBrowseModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4"
          style={{
            paddingTop: `calc(1rem + env(safe-area-inset-top, 0px))`,
            paddingBottom: `calc(0.25rem + env(safe-area-inset-bottom, 0px) * 0.3)`,
            paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
            paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`
          }}
          onClick={() => setShowBrowseModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full flex flex-col"
            style={{
              maxHeight: `calc(90vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 2rem)`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Browse Groups</h3>
              <button
                onClick={() => setShowBrowseModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Search */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <label htmlFor="browse-groups-search" className="sr-only">Search groups</label>
                <input
                  type="text"
                  id="browse-groups-search"
                  name="browse-groups-search"
                  placeholder="Search groups..."
                  value={browseSearchTerm}
                  onChange={(e) => setBrowseSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Groups List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 overscroll-contain touch-pan-y -webkit-overflow-scrolling-touch">
              {allGroups.length === 0 ? (
                <div className="text-center py-8">
                  <Loader className="animate-spin mx-auto text-indigo-600 dark:text-indigo-400 mb-4" size={48} />
                  <p className="text-gray-500 dark:text-gray-400">Loading groups...</p>
                </div>
              ) : filteredBrowseGroups.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
                  <p className="text-gray-500 dark:text-gray-400">
                    {browseSearchTerm ? 'No groups found matching your search' : 'No groups available. Create one to get started!'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBrowseGroups.map((group) => {
                    const isMember = group.members?.includes(user?.uid);
                    const hasRequested = group.joinRequests?.includes(user?.uid);
                    
                    return (
                      <div
                        key={group.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-800 dark:text-white">
                                {group.name}
                              </h4>
                              {isMember && (
                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                                  Joined
                                </span>
                              )}
                              {group.admins?.includes(user?.uid) && (
                                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                                  Admin
                                </span>
                              )}
                            </div>
                            {group.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {group.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>{group.members?.length || 0} member(s)</span>
                              {group.admins?.length > 0 && (
                                <span>{group.admins.length} admin(s)</span>
                              )}
                            </div>
                          </div>
                          {!isMember ? (
                            <button
                              onClick={() => handleRequestToJoin(group.id)}
                              disabled={requesting === group.id || hasRequested}
                              className={`ml-4 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                                hasRequested
                                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                              }`}
                            >
                              {requesting === group.id ? (
                                <>
                                  <Loader className="animate-spin" size={16} />
                                  <span>Requesting...</span>
                                </>
                              ) : hasRequested ? (
                                <>
                                  <CheckCircle size={16} />
                                  <span>Requested</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus size={16} />
                                  <span>Request to Join</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setShowBrowseModal(false);
                                setSelectedGroup(group);
                                setActiveView('group-chat');
                              }}
                              className="ml-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors text-sm font-medium"
                            >
                              <Users size={16} />
                              <span>Open</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;

