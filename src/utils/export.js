/**
 * Export utilities for chat history and data
 */

/**
 * Export messages to JSON
 */
export const exportMessagesToJSON = (messages, filename = 'chat-history') => {
  const data = {
    exportedAt: new Date().toISOString(),
    totalMessages: messages.length,
    messages: messages.map(msg => ({
      id: msg.id,
      text: msg.text || msg.displayText || '',
      userName: msg.userName || 'Unknown',
      userId: msg.userId,
      timestamp: msg.timestamp?.toDate?.()?.toISOString() || msg.timestamp,
      reactions: msg.reactions || {},
      fileUrl: msg.fileUrl || null,
      fileName: msg.fileName || null,
      isToxic: msg.isToxic || false,
      toxicityScore: msg.toxicityScore || 0,
      pinned: msg.pinned || false,
      edited: msg.edited || false,
      replyTo: msg.replyTo || null
    }))
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadFile(blob, `${filename}.json`);
};

/**
 * Export messages to CSV
 */
export const exportMessagesToCSV = (messages, filename = 'chat-history') => {
  const headers = ['Date', 'Time', 'User', 'Message', 'Reactions', 'Has File', 'Toxic', 'Pinned'];
  const rows = messages.map(msg => {
    const timestamp = msg.timestamp?.toDate?.() || new Date(msg.timestamp || 0);
    const date = timestamp.toLocaleDateString();
    const time = timestamp.toLocaleTimeString();
    const reactions = msg.reactions ? Object.keys(msg.reactions).length : 0;
    const hasFile = msg.fileUrl || msg.fileName ? 'Yes' : 'No';
    const toxic = msg.isToxic ? 'Yes' : 'No';
    const pinned = msg.pinned ? 'Yes' : 'No';
    const text = (msg.text || msg.displayText || '').replace(/"/g, '""'); // Escape quotes

    return [
      date,
      time,
      msg.userName || 'Unknown',
      `"${text}"`, // Wrap in quotes for CSV
      reactions,
      hasFile,
      toxic,
      pinned
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `${filename}.csv`);
};

/**
 * Export messages to TXT (plain text)
 */
export const exportMessagesToTXT = (messages, filename = 'chat-history') => {
  const lines = messages.map(msg => {
    const timestamp = msg.timestamp?.toDate?.() || new Date(msg.timestamp || 0);
    const dateTime = timestamp.toLocaleString();
    const userName = msg.userName || 'Unknown';
    const text = msg.text || msg.displayText || '';
    const reactions = msg.reactions ? Object.entries(msg.reactions).map(([emoji, users]) => 
      `${emoji} (${users.length})`
    ).join(', ') : '';

    let line = `[${dateTime}] ${userName}: ${text}`;
    if (reactions) line += ` [Reactions: ${reactions}]`;
    if (msg.fileName) line += ` [File: ${msg.fileName}]`;
    if (msg.pinned) line += ` [PINNED]`;
    if (msg.isToxic) line += ` [TOXIC]`;

    return line;
  });

  const content = lines.join('\n\n');
  const blob = new Blob([content], { type: 'text/plain' });
  downloadFile(blob, `${filename}.txt`);
};

/**
 * Download file helper
 */
const downloadFile = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

