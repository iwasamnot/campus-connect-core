/**
 * Safety Override Layer
 * Trust & Safety monitoring for crisis intervention
 */

/**
 * Check user query for distress signals and crisis keywords
 * @param {string} userQuery - The user's input text
 * @returns {Object} - Safety check result
 */
export const checkSafety = (userQuery) => {
  if (!userQuery || typeof userQuery !== 'string') {
    return {
      isSafe: true,
      requiresIntervention: false
    };
  }

  const query = userQuery.toLowerCase().trim();

  // Crisis keywords - comprehensive list
  const crisisKeywords = [
    // Self-harm
    'suicide', 'kill myself', 'end my life', 'take my life', 'end it all',
    'want to die', 'wish i was dead', 'not worth living', 'better off dead',
    // Hopelessness
    'hopeless', 'no point', 'nothing matters', 'give up', 'can\'t go on',
    'no way out', 'trapped', 'no hope', 'desperate', 'helpless',
    // Distress signals
    'hurting myself', 'self harm', 'cutting', 'overdose', 'overdosing',
    'jump off', 'jump from', 'hang myself', 'harm myself',
    // Emotional distress
    'can\'t cope', 'can\'t handle', 'breaking down', 'falling apart',
    'losing it', 'going crazy', 'mental breakdown'
  ];

  // Check for crisis keywords
  const hasCrisisKeyword = crisisKeywords.some(keyword => {
    // Use word boundary matching for better accuracy
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(query);
  });

  // Additional context checks (phrases that indicate serious distress)
  const distressPhrases = [
    /i (want|wish|need) to (die|kill|end)/i,
    /(going|planning) to (kill|hurt|harm) (myself|me)/i,
    /(can't|cannot) (take|handle|deal) (this|it|anymore)/i,
    /(no|nothing) (point|reason) (to|in) (live|living|life)/i
  ];

  const hasDistressPhrase = distressPhrases.some(regex => regex.test(query));

  const requiresIntervention = hasCrisisKeyword || hasDistressPhrase;

  return {
    isSafe: !requiresIntervention,
    requiresIntervention,
    matchedKeyword: hasCrisisKeyword ? crisisKeywords.find(k => query.includes(k)) : null,
    severity: requiresIntervention ? 'high' : 'low'
  };
};

/**
 * Get crisis intervention response
 * @returns {Object} - Crisis intervention response with resources
 */
export const getCrisisResponse = () => {
  return {
    type: 'CRISIS_INTERVENTION',
    message: "I'm hearing that you're going through a tough time. I'm an AI, but there are people who can help you right now.",
    resources: [
      {
        name: 'Lifeline Australia',
        phone: '13 11 14',
        available: '24/7',
        description: 'Free, confidential crisis support'
      },
      {
        name: 'Beyond Blue',
        phone: '1300 22 4636',
        available: '24/7',
        description: 'Mental health support and information'
      },
      {
        name: 'Kids Helpline',
        phone: '1800 55 1800',
        available: '24/7',
        description: 'Free, private counselling for young people'
      },
      {
        name: 'SISTC Student Support',
        email: 'support@sistc.nsw.edu.au',
        available: 'Business hours',
        description: 'On-campus student support services'
      },
      {
        name: 'Emergency Services',
        phone: '000',
        available: '24/7',
        description: 'For immediate life-threatening emergencies'
      }
    ],
    additionalInfo: {
      text: 'You are not alone. These services are free, confidential, and available right now.',
      webResources: [
        {
          name: 'Lifeline Website',
          url: 'https://www.lifeline.org.au'
        },
        {
          name: 'Beyond Blue Website',
          url: 'https://www.beyondblue.org.au'
        }
      ]
    }
  };
};

/**
 * Enhanced safety check with context awareness
 * @param {string} userQuery - The user's input
 * @param {Object} context - Additional context (conversation history, etc.)
 * @returns {Object} - Enhanced safety check result
 */
export const checkSafetyWithContext = (userQuery, context = {}) => {
  const basicCheck = checkSafety(userQuery);
  
  if (!basicCheck.requiresIntervention) {
    return basicCheck;
  }

  // Add context-based severity assessment
  const conversationHistory = context.conversationHistory || [];
  const recentDistressSignals = conversationHistory
    .slice(-5)
    .filter(msg => checkSafety(msg.text || msg.content).requiresIntervention)
    .length;

  return {
    ...basicCheck,
    severity: recentDistressSignals > 1 ? 'critical' : 'high',
    contextFlags: {
      repeatedSignals: recentDistressSignals > 1,
      conversationLength: conversationHistory.length
    }
  };
};
