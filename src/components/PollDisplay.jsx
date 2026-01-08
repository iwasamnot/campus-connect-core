import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BarChart3, CheckCircle, Users, Clock } from 'lucide-react';
// Use window.__firebaseDb to avoid import/export issues in production builds
const db = typeof window !== 'undefined' && window.__firebaseDb 
  ? window.__firebaseDb 
  : null;
import { doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';

/**
 * Poll Display Component
 * Display polls with voting functionality
 */
const PollDisplay = ({ poll, pollId, collectionName }) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [voting, setVoting] = useState(false);

  const hasVoted = poll.voters?.includes(user?.uid);
  const hasExpired = new Date(poll.expiresAt?.toDate?.() || poll.expiresAt) < new Date();
  const totalVotes = poll.totalVotes || 0;

  const handleVote = async (optionIndex) => {
    if (!user?.uid) return;
    if (hasVoted && !poll.allowMultiple) {
      showError('You have already voted');
      return;
    }
    if (hasExpired) {
      showError('This poll has expired');
      return;
    }

    setVoting(true);

    try {
      const pollRef = doc(db, collectionName, pollId);
      const option = poll.options[optionIndex];
      
      // Check if user already voted for this option
      if (option.voters?.includes(user.uid)) {
        // Remove vote
        await updateDoc(pollRef, {
          [`options.${optionIndex}.votes`]: Math.max(0, option.votes - 1),
          [`options.${optionIndex}.voters`]: arrayRemove(user.uid),
          totalVotes: Math.max(0, totalVotes - 1),
          voters: arrayRemove(user.uid)
        });
        success('Vote removed');
      } else {
        // Add vote
        const votersList = poll.voters || [];
        const shouldAddVoter = poll.allowMultiple || !votersList.includes(user.uid);
        
        await updateDoc(pollRef, {
          [`options.${optionIndex}.votes`]: (option.votes || 0) + 1,
          [`options.${optionIndex}.voters`]: arrayUnion(user.uid),
          totalVotes: totalVotes + 1,
          ...(shouldAddVoter && { voters: arrayUnion(user.uid) })
        });
        success('Vote recorded!');
      }
    } catch (error) {
      console.error('Error voting:', error);
      showError('Failed to vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const getPercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const formatExpiryDate = (expiresAt) => {
    const date = expiresAt?.toDate?.() || expiresAt;
    const now = new Date();
    const diff = date - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
    return 'Ending soon';
  };

  return (
    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-2">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-gray-800 dark:text-white">{poll.question}</h3>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 mt-1">
            <span className="flex items-center gap-1">
              <Users size={14} />
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
            </span>
            {!hasExpired && (
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {formatExpiryDate(poll.expiresAt)}
              </span>
            )}
            {hasExpired && <span className="text-red-600 dark:text-red-400">Expired</span>}
            {poll.anonymous && (
              <span className="text-gray-500">Anonymous</span>
            )}
          </div>
        </div>
        {hasVoted && (
          <CheckCircle size={20} className="text-green-600 dark:text-green-400 flex-shrink-0" />
        )}
      </div>

      <div className="space-y-2">
        {poll.options.map((option, index) => {
          const percentage = getPercentage(option.votes || 0);
          const userVoted = option.voters?.includes(user?.uid);
          const isWinning = !hasExpired && totalVotes > 0 && (option.votes || 0) === Math.max(...poll.options.map(o => o.votes || 0));

          return (
            <button
              key={index}
              onClick={() => !voting && !hasExpired && handleVote(index)}
              disabled={voting || hasExpired || (!poll.allowMultiple && hasVoted && !userVoted)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                userVoted
                  ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-100 dark:bg-indigo-900/40'
                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              } ${
                hasExpired || (hasVoted && !poll.allowMultiple && !userVoted)
                  ? 'opacity-60 cursor-not-allowed'
                  : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-medium ${userVoted ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-800 dark:text-white'}`}>
                  {option.text}
                  {userVoted && <CheckCircle size={16} className="inline ml-2 text-indigo-600 dark:text-indigo-400" />}
                  {isWinning && totalVotes > 0 && (
                    <span className="ml-2 text-xs bg-yellow-400 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 px-2 py-0.5 rounded">Winner</span>
                  )}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {percentage}% ({option.votes || 0})
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    userVoted
                      ? 'bg-indigo-600 dark:bg-indigo-400'
                      : 'bg-indigo-400 dark:bg-indigo-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PollDisplay;

