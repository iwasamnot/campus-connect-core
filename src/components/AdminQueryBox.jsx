import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { HelpCircle, Loader2, Play, Sparkles } from 'lucide-react';

// Use window.__firebaseDb to avoid import/export issues in production builds
const db = typeof window !== 'undefined' && window.__firebaseDb ? window.__firebaseDb : null;

const toDateSafe = (value) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const formatDateTime = (value) => {
  const d = toDateSafe(value);
  return d ? d.toLocaleString() : 'N/A';
};

const formatRelative = (value) => {
  const d = toDateSafe(value);
  if (!d) return 'N/A';
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
};

const normalize = (s) => (s || '').toLowerCase().trim().replace(/\s+/g, ' ');

const examples = [
  'Who was last online?',
  'Who sent the last message?',
  'Show the last message',
  'How many users are online?',
  'Who registered last?',
];

const AdminQueryBox = () => {
  const [question, setQuestion] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const hint = useMemo(
    () =>
      'Try: "Who was last online?", "Who sent the last message?", "How many users are online?", "Who registered last?"',
    [],
  );

  const run = useCallback(
    async (rawQuestion) => {
      const qText = normalize(rawQuestion);
      if (!qText) return;
      if (!db) {
        setError('Database not available yet. Please refresh and try again.');
        return;
      }

      setRunning(true);
      setError(null);
      setResult(null);

      try {
        // Intent detection (simple but effective for common admin queries)
        const wantsLastOnline =
          qText.includes('last online') || qText.includes('recently online') || qText.includes('most recent online');

        const wantsLastMessage =
          qText.includes('last message') ||
          qText.includes('latest message') ||
          qText.includes('most recent message') ||
          qText === 'show last message' ||
          qText === 'show the last message';

        const wantsLastMessageSender =
          wantsLastMessage || qText.includes('who sent') || qText.includes('sender') || qText.includes('who wrote');

        const wantsOnlineCount =
          qText.includes('how many') && qText.includes('online') ||
          qText.includes('users online') ||
          qText.includes('online users');

        const wantsLastRegistered =
          qText.includes('registered last') ||
          qText.includes('last registered') ||
          qText.includes('signed up last') ||
          qText.includes('who registered') ||
          qText.includes('newest user');

        if (wantsLastOnline) {
          const usersQ = query(collection(db, 'users'), orderBy('lastSeen', 'desc'), limit(1));
          const snap = await getDocs(usersQ);
          const docSnap = snap.docs[0];
          if (!docSnap) {
            setResult({ title: 'Last online user', lines: ['No user records found.'] });
            return;
          }
          const u = { id: docSnap.id, ...docSnap.data() };
          setResult({
            title: 'Last online user',
            lines: [
              `User: ${u.name || u.email || u.studentEmail || u.id}`,
              `Email: ${u.email || u.studentEmail || 'N/A'}`,
              `isOnline flag: ${u.isOnline === true ? 'true' : 'false'}`,
              `Last seen: ${formatDateTime(u.lastSeen)} (${formatRelative(u.lastSeen)})`,
            ],
          });
          return;
        }

        if (wantsOnlineCount) {
          // Prefer server-side count to reduce reads (falls back if unsupported)
          const onlineQ = query(collection(db, 'users'), where('isOnline', '==', true));
          try {
            const countSnap = await getCountFromServer(onlineQ);
            setResult({
              title: 'Users online (isOnline = true)',
              lines: [`Count: ${countSnap.data().count}`],
            });
          } catch {
            const snap = await getDocs(onlineQ);
            setResult({
              title: 'Users online (isOnline = true)',
              lines: [`Count: ${snap.size}`],
            });
          }
          return;
        }

        if (wantsLastRegistered) {
          // createdAt is stored as ISO string in this project (sortable)
          const usersQ = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(1));
          const snap = await getDocs(usersQ);
          const docSnap = snap.docs[0];
          if (!docSnap) {
            setResult({ title: 'Last registered user', lines: ['No user records found.'] });
            return;
          }
          const u = { id: docSnap.id, ...docSnap.data() };
          setResult({
            title: 'Last registered user',
            lines: [
              `User: ${u.name || u.email || u.studentEmail || u.id}`,
              `Email: ${u.email || u.studentEmail || 'N/A'}`,
              `Created: ${formatDateTime(u.createdAt)} (${formatRelative(u.createdAt)})`,
              `Role: ${u.role || 'N/A'}`,
            ],
          });
          return;
        }

        if (wantsLastMessageSender) {
          const msgQ = query(collection(db, 'messages'), orderBy('timestamp', 'desc'), limit(1));
          const snap = await getDocs(msgQ);
          const docSnap = snap.docs[0];
          if (!docSnap) {
            setResult({ title: 'Last message', lines: ['No messages found.'] });
            return;
          }
          const m = { id: docSnap.id, ...docSnap.data() };
          const text = (m.displayText || m.text || '').toString();
          const shortText = text.length > 200 ? `${text.slice(0, 200)}…` : text;

          setResult({
            title: wantsLastMessage ? 'Last message' : 'Last message sender',
            lines: [
              `Sender: ${m.userName || m.userEmail || m.userId || 'N/A'}`,
              `Email: ${m.userEmail || 'N/A'}`,
              `Time: ${formatDateTime(m.timestamp)} (${formatRelative(m.timestamp)})`,
              `Message: ${shortText || 'N/A'}`,
            ],
          });
          return;
        }

        setResult({
          title: 'Query not recognized',
          lines: [
            `I couldn't match that query yet.`,
            `Examples: ${examples.join(' | ')}`,
          ],
        });
      } catch (e) {
        console.error('AdminQueryBox error:', e);
        setError(e?.message || 'Failed to run query. Please try again.');
      } finally {
        setRunning(false);
      }
    },
    [setError, setResult],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 glass-panel border border-white/10 rounded-xl p-4 backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 glass-panel border border-white/10 rounded-lg">
            <Sparkles size={18} className="text-indigo-400" />
          </div>
          <h3 className="font-semibold text-white text-glow">Admin Queries</h3>
        </div>
        <div className="text-xs text-white/60 flex items-center gap-1">
          <HelpCircle size={14} />
          <span className="hidden sm:inline">{hint}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <label htmlFor="admin-query-input" className="sr-only">
          Ask an admin query
        </label>
        <input
          id="admin-query-input"
          name="admin-query-input"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') run(question);
          }}
          placeholder='e.g. "Who was last online?"'
          className="flex-1 px-4 py-2.5 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-white/10 transition-all duration-300 hover:border-white/20 disabled:opacity-50"
          disabled={running}
        />
        <motion.button
          type="button"
          onClick={() => run(question)}
          disabled={running || !normalize(question)}
          whileHover={{ scale: running || !normalize(question) ? 1 : 1.02 }}
          whileTap={{ scale: running || !normalize(question) ? 1 : 0.98 }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:transform-none"
        >
          {running ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
          Run
        </motion.button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {examples.map((ex) => (
          <motion.button
            key={ex}
            type="button"
            onClick={() => {
              setQuestion(ex);
              run(ex);
            }}
            disabled={running}
            whileHover={{ scale: running ? 1 : 1.05 }}
            whileTap={{ scale: running ? 1 : 0.95 }}
            className="px-3 py-1.5 text-xs rounded-full glass-panel bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 hover:border-indigo-500/50 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
          >
            {ex}
          </motion.button>
        ))}
      </div>

      {(error || result) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 border-t border-white/10 pt-3"
        >
          {error && (
            <div className="p-3 glass-panel bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-sm">
              {error}
            </div>
          )}
          {result && (
            <div className="text-sm">
              <div className="font-semibold text-white text-glow mb-2">{result.title}</div>
              <ul className="mt-2 space-y-1.5 text-white/80">
                {result.lines.map((line, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="break-words p-2 glass-panel border border-white/10 rounded-lg"
                  >
                    {line}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default AdminQueryBox;

