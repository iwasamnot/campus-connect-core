import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
// Use window.__firebaseDb to avoid import/export issues in production builds
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;
import { Users, Plus, Search, X, Loader, Globe, UserPlus, Mail, CheckCircle, XCircle } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from './AnimatedComponents';

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
      <div className="flex items-center justify-center h-screen h-[100dvh] bg-transparent relative">
        <FadeIn delay={0.1}>
          <div className="text-center glass-panel rounded-[2rem] p-8 border border-white/10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader className="mx-auto text-indigo-300 mb-4" size={48} />
            </motion.div>
            <p className="text-white/70">Loading groups...</p>
          </div>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen h-[100dvh] bg-transparent relative overflow-hidden">
      {/* Header - Fluid.so aesthetic */}
      <FadeIn delay={0.1}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel border-b border-white/10 px-6 py-4 relative z-10 rounded-t-[2rem] flex-shrink-0"
          style={{
            paddingTop: `max(1rem, env(safe-area-inset-top, 0px) + 0.5rem)`,
            paddingBottom: `1rem`,
            paddingLeft: `calc(1.5rem + env(safe-area-inset-left, 0px))`,
            paddingRight: `calc(1.5rem + env(safe-area-inset-right, 0px))`
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white text-glow">Groups</h2>
              <p className="text-xs md:text-sm text-white/60">Create and join study groups</p>
            </div>
            <div className="flex gap-2">
              <motion.button
                onClick={() => setShowBrowseModal(true)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-green-600/80 hover:bg-green-600 text-white rounded-xl transition-all duration-300 text-sm shadow-lg hover:shadow-xl font-medium"
                aria-label="Browse available groups"
              >
                <Globe size={18} />
                <span className="hidden sm:inline">Browse Groups</span>
                <span className="sm:hidden">Browse</span>
              </motion.button>
              <motion.button
                onClick={() => setShowCreateModal(true)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="send-button-shimmer flex items-center gap-2 px-3 md:px-4 py-2 text-white rounded-xl transition-all duration-300 text-sm shadow-lg hover:shadow-xl font-medium"
                aria-label="Create a new group"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Create Group</span>
                <span className="sm:hidden">Create</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </FadeIn>

      {/* Search Bar - Fluid.so aesthetic */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel border-b border-white/10 px-4 md:px-6 py-3 md:py-4 relative z-5 flex-shrink-0"
        style={{
          paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
          paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`
        }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={18} />
          <label htmlFor="groups-search" className="sr-only">Search groups</label>
          <input
            type="text"
            id="groups-search"
            name="groups-search"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300"
          />
        </div>
      </motion.div>

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
              <Users className="mx-auto text-white/40 mb-4 hidden" size={48} />
              <p className="text-white/60 text-lg">
                {searchTerm ? 'No groups found matching your search' : 'No groups yet. Create or join one!'}
              </p>
            </div>
          </div>
        ) : (
          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" staggerDelay={0.05} initialDelay={0.3}>
            {filteredGroups.map((group, index) => (
              <StaggerItem key={group.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-panel rounded-[2rem] border border-white/10 p-6 shadow-xl hover:shadow-2xl transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedGroup(group);
                    setActiveView('group-chat');
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1 text-glow-subtle">
                        {group.name}
                      </h3>
                      {group.description && (
                        <p className="text-sm text-white/60 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                    </div>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveGroup(group.id, group.name);
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="ml-2 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/30"
                      title="Leave group"
                    >
                      <X size={18} />
                    </motion.button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span className="flex items-center gap-1">
                      {group.admins?.includes(user.uid) && (
                        <span className="px-2 py-0.5 bg-indigo-600/30 border border-indigo-500/50 text-indigo-200 rounded-lg text-xs font-medium">
                          Admin
                        </span>
                      )}
                    </span>
                    <span>{group.members?.length || 0} member(s)</span>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      {/* Create Group Modal - Fluid.so aesthetic */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            style={{
              paddingTop: `calc(1rem + env(safe-area-inset-top, 0px))`,
              paddingBottom: `calc(0.25rem + env(safe-area-inset-bottom, 0px) * 0.3)`,
              paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
              paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`
            }}
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel rounded-[2rem] shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto overscroll-contain border border-white/10" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white text-glow-subtle">Create New Group</h3>
                <motion.button
                  onClick={() => setShowCreateModal(false)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X size={24} />
                </motion.button>
              </div>
              <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
                <div>
                  <label htmlFor="group-name" className="block text-sm font-medium text-white/90 mb-2">
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
                    className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300"
                    disabled={creating}
                  />
                </div>
                <div>
                  <label htmlFor="group-description" className="block text-sm font-medium text-white/90 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    id="group-description"
                    name="groupDescription"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="Enter group description"
                    rows={3}
                    className="w-full px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 resize-none"
                    disabled={creating}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="submit"
                    disabled={creating}
                    whileHover={!creating ? { scale: 1.02, y: -2 } : {}}
                    whileTap={!creating ? { scale: 0.98 } : {}}
                    className="send-button-shimmer flex-1 flex items-center justify-center gap-2 text-white font-semibold py-3 px-6 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {creating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="rounded-full h-5 w-5 border-b-2 border-white"
                        />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={20} />
                        <span>Create Group</span>
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={creating}
                    whileHover={!creating ? { scale: 1.02, y: -2 } : {}}
                    whileTap={!creating ? { scale: 0.98 } : {}}
                    className="px-6 py-3 border-2 border-white/20 bg-white/5 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/10 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Browse Groups Modal - Fluid.so aesthetic */}
      <AnimatePresence>
        {showBrowseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            style={{
              paddingTop: `calc(1rem + env(safe-area-inset-top, 0px))`,
              paddingBottom: `calc(0.25rem + env(safe-area-inset-bottom, 0px) * 0.3)`,
              paddingLeft: `calc(1rem + env(safe-area-inset-left, 0px))`,
              paddingRight: `calc(1rem + env(safe-area-inset-right, 0px))`
            }}
            onClick={() => setShowBrowseModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel rounded-[2rem] shadow-2xl max-w-2xl w-full flex flex-col border border-white/10"
              style={{
                maxHeight: `calc(90vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 2rem)`
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <h3 className="text-xl font-bold text-white text-glow-subtle">Browse Groups</h3>
                <motion.button
                  onClick={() => setShowBrowseModal(false)}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <X size={24} />
                </motion.button>
              </div>
              
              {/* Search - Fluid.so aesthetic */}
              <div className="px-6 py-4 border-b border-white/10 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={18} />
                  <label htmlFor="browse-groups-search" className="sr-only">Search groups</label>
                  <input
                    type="text"
                    id="browse-groups-search"
                    name="browse-groups-search"
                    placeholder="Search groups..."
                    value={browseSearchTerm}
                    onChange={(e) => setBrowseSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Groups List - Fluid.so aesthetic */}
              <div className="flex-1 overflow-y-auto px-6 py-4 overscroll-contain touch-pan-y -webkit-overflow-scrolling-touch">
                {allGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader className="mx-auto text-indigo-300 mb-4" size={48} />
                    </motion.div>
                    <p className="text-white/60">Loading groups...</p>
                  </div>
                ) : filteredBrowseGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="mx-auto text-white/40 mb-4" size={48} />
                    <p className="text-white/60">
                      {browseSearchTerm ? 'No groups found matching your search' : 'No groups available. Create one to get started!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBrowseGroups.map((group, index) => {
                      const isMember = group.members?.includes(user?.uid);
                      const hasRequested = group.joinRequests?.includes(user?.uid);
                      
                      return (
                        <motion.div
                          key={group.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ y: -2, scale: 1.01 }}
                          className="glass-panel border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-white">
                                  {group.name}
                                </h4>
                                {isMember && (
                                  <span className="px-2 py-0.5 bg-green-600/30 border border-green-500/50 text-green-200 rounded-lg text-xs font-medium">
                                    Joined
                                  </span>
                                )}
                                {group.admins?.includes(user?.uid) && (
                                  <span className="px-2 py-0.5 bg-indigo-600/30 border border-indigo-500/50 text-indigo-200 rounded-lg text-xs font-medium">
                                    Admin
                                  </span>
                                )}
                              </div>
                              {group.description && (
                                <p className="text-sm text-white/60 mb-2">
                                  {group.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-white/50">
                                <span>{group.members?.length || 0} member(s)</span>
                                {group.admins?.length > 0 && (
                                  <span>{group.admins.length} admin(s)</span>
                                )}
                              </div>
                            </div>
                            {!isMember ? (
                              <motion.button
                                onClick={() => handleRequestToJoin(group.id)}
                                disabled={requesting === group.id || hasRequested}
                                whileHover={!requesting && !hasRequested ? { scale: 1.05, y: -2 } : {}}
                                whileTap={!requesting && !hasRequested ? { scale: 0.95 } : {}}
                                className={`ml-4 flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-medium ${
                                  hasRequested
                                    ? 'bg-white/10 border border-white/20 text-white/50 cursor-not-allowed'
                                    : 'send-button-shimmer text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                                }`}
                              >
                                {requesting === group.id ? (
                                  <>
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="rounded-full h-4 w-4 border-b-2 border-white"
                                    />
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
                              </motion.button>
                            ) : (
                              <motion.button
                                onClick={() => {
                                  setShowBrowseModal(false);
                                  setSelectedGroup(group);
                                  setActiveView('group-chat');
                                }}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="ml-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600/80 hover:bg-green-600 text-white transition-all text-sm font-medium shadow-lg hover:shadow-xl"
                              >
                                <Users size={16} />
                                <span>Open</span>
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Groups;

