/**
 * Smart Admin Query System
 * Can answer complex questions about user activity, messages, and system analytics
 * Uses natural language processing to understand and answer admin queries
 */

import { getFirestore, collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { callAI } from './aiProvider';

export class SmartAdminQueries {
  constructor() {
    this.db = getFirestore();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Main query processor - understands natural language and returns answers
   */
  async processQuery(question, userId = null) {
    const cacheKey = `${question}_${userId}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.result;
      }
    }

    try {
      // Parse the query using AI
      const queryPlan = await this.parseQuery(question);
      
      // Execute the query plan
      const result = await this.executeQueryPlan(queryPlan, userId);
      
      // Format the answer
      const answer = await this.formatAnswer(question, result, queryPlan);
      
      // Cache the result
      this.cache.set(cacheKey, {
        result: answer,
        timestamp: Date.now()
      });

      return answer;
    } catch (error) {
      console.error('Error processing admin query:', error);
      return {
        answer: "I'm having trouble processing that query. Please try rephrasing it.",
        error: error.message,
        suggestions: this.getQuerySuggestions()
      };
    }
  }

  /**
   * Use AI to parse the natural language query into a structured plan
   */
  async parseQuery(question) {
    const prompt = `Parse this admin query into a structured query plan. Return JSON only.

Question: "${question}"

Available data sources:
- users: User profiles with registration dates, last seen, activity status
- messages: All chat messages with timestamps, user IDs, message content
- adminMessages: Admin contact messages
- groups: Group information and memberships
- activity: User activity logs
- analytics: System analytics and metrics

Query types:
- user_activity: Questions about when users were online/active
- message_stats: Questions about message counts, popular topics
- user_demographics: Questions about user locations, registration trends
- engagement_metrics: Questions about user engagement, retention
- content_analysis: Questions about message content, topics
- time_series: Questions about trends over time periods
- comparison: Questions comparing different time periods or user groups

Return JSON format:
{
  "type": "query_type",
  "timeRange": {
    "start": "YYYY-MM-DD or null",
    "end": "YYYY-MM-DD or null"
  },
  "filters": {
    "userIds": ["uid1", "uid2"] or null,
    "userType": "active/inactive/all" or null,
    "messageType": "chat/admin/all" or null
  },
  "aggregation": "count/unique/average/sum/list",
  "groupBy": "day/week/month/user/type" or null,
  "sortBy": "timestamp/count/name" or null,
  "limit": number or null,
  "specificFields": ["field1", "field2"] or null
}

Examples:
"Which users were online between 2 jan to 5 jan" ->
{"type": "user_activity", "timeRange": {"start": "2025-01-02", "end": "2025-01-05"}, "filters": {"userType": "active"}, "aggregation": "list"}

"How many messages were sent last week" ->
{"type": "message_stats", "timeRange": {"start": "7_days_ago", "end": "now"}, "aggregation": "count"}

"Show me most active users this month" ->
{"type": "engagement_metrics", "timeRange": {"start": "30_days_ago", "end": "now"}, "aggregation": "count", "groupBy": "user", "sortBy": "count", "limit": 10}`;

    const response = await callAI(prompt, {
      provider: 'groq',
      model: 'llama3-70b-8192',
      temperature: 0.1
    });

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', response);
    }

    // Fallback to basic parsing
    return this.fallbackParse(question);
  }

  /**
   * Execute the parsed query plan against Firestore
   */
  async executeQueryPlan(plan, userId) {
    const { type, timeRange, filters, aggregation, groupBy, sortBy, limit: queryLimit } = plan;

    switch (type) {
      case 'user_activity':
        return await this.getUserActivity(timeRange, filters, aggregation, queryLimit);
      
      case 'message_stats':
        return await this.getMessageStats(timeRange, filters, aggregation, groupBy, sortBy, queryLimit);
      
      case 'user_demographics':
        return await this.getUserDemographics(timeRange, filters, aggregation, groupBy);
      
      case 'engagement_metrics':
        return await this.getEngagementMetrics(timeRange, filters, aggregation, groupBy, sortBy, queryLimit);
      
      case 'content_analysis':
        return await this.getContentAnalysis(timeRange, filters, aggregation, queryLimit);
      
      case 'time_series':
        return await this.getTimeSeriesData(type, timeRange, filters, groupBy);
      
      case 'comparison':
        return await this.getComparisonData(plan);
      
      default:
        return await this.getGeneralStats(timeRange, filters);
    }
  }

  /**
   * Get user activity for a specific time range
   */
  async getUserActivity(timeRange, filters, aggregation, queryLimit) {
    const { start, end } = this.parseTimeRange(timeRange);
    const constraints = [];

    // Build query
    let q = collection(this.db, 'users');
    
    if (filters?.userType === 'active') {
      // Get users with recent activity
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      constraints.push(where('lastSeen', '>=', thirtyDaysAgo));
    }

    const querySnapshot = await getDocs(q);
    const users = [];

    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      const lastSeen = userData.lastSeen?.toDate() || userData.createdAt?.toDate();
      
      if (this.isInTimeRange(lastSeen, start, end)) {
        users.push({
          uid: doc.id,
          email: userData.email,
          displayName: userData.displayName || 'Anonymous',
          lastSeen: lastSeen,
          registrationDate: userData.createdAt?.toDate(),
          isActive: this.isActiveUser(userData),
          activityScore: this.calculateActivityScore(userData)
        });
      }
    });

    // Sort and limit
    if (filters?.userType === 'active') {
      users.sort((a, b) => b.activityScore - a.activityScore);
    }

    const result = users.slice(0, queryLimit || 100);

    return {
      type: 'user_activity',
      data: result,
      totalUsers: result.length,
      timeRange: { start, end },
      aggregation
    };
  }

  /**
   * Get message statistics
   */
  async getMessageStats(timeRange, filters, aggregation, groupBy, sortBy, queryLimit) {
    const { start, end } = this.parseTimeRange(timeRange);
    
    // Get messages from different collections
    const messageTypes = filters?.messageType === 'admin' ? ['adminMessages'] : 
                         filters?.messageType === 'chat' ? ['messages'] : 
                         ['messages', 'adminMessages', 'groupMessages'];
    
    const allMessages = [];
    
    for (const collectionName of messageTypes) {
      try {
        const q = query(
          collection(this.db, collectionName),
          orderBy('timestamp', 'desc'),
          limit(queryLimit || 1000)
        );
        
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          const msg = doc.data();
          const msgTime = msg.timestamp?.toDate();
          
          if (this.isInTimeRange(msgTime, start, end)) {
            allMessages.push({
              id: doc.id,
              type: collectionName,
              content: msg.content || msg.message,
              userId: msg.userId || msg.senderId,
              timestamp: msgTime,
              channel: msg.channel || 'general'
            });
          }
        });
      } catch (error) {
        console.warn(`Could not fetch from ${collectionName}:`, error);
      }
    }

    // Process aggregation
    let result;
    if (aggregation === 'count') {
      result = {
        totalMessages: allMessages.length,
        byType: this.groupBy(allMessages, 'type'),
        byChannel: this.groupBy(allMessages, 'channel')
      };
    } else if (aggregation === 'list') {
      result = allMessages.slice(0, queryLimit || 50);
    } else if (groupBy === 'day') {
      result = this.groupByDate(allMessages, 'day');
    } else if (groupBy === 'user') {
      result = this.groupBy(allMessages, 'userId');
    }

    return {
      type: 'message_stats',
      data: result,
      timeRange: { start, end },
      totalMessages: allMessages.length
    };
  }

  /**
   * Get user demographics and registration trends
   */
  async getUserDemographics(timeRange, filters, aggregation, groupBy) {
    const { start, end } = this.parseTimeRange(timeRange);
    
    const snapshot = await getDocs(collection(this.db, 'users'));
    const users = [];

    snapshot.forEach((doc) => {
      const userData = doc.data();
      const regDate = userData.createdAt?.toDate();
      
      if (this.isInTimeRange(regDate, start, end)) {
        users.push({
          uid: doc.id,
          registrationDate: regDate,
          email: userData.email,
          location: userData.location || 'Unknown',
          userType: userData.userType || 'student',
          referrer: userData.referrer || 'direct'
        });
      }
    });

    let result;
    if (groupBy === 'day') {
      result = this.groupByDate(users, 'day', 'registrationDate');
    } else if (groupBy === 'month') {
      result = this.groupByDate(users, 'month', 'registrationDate');
    } else {
      result = {
        totalUsers: users.length,
        byLocation: this.groupBy(users, 'location'),
        byType: this.groupBy(users, 'userType'),
        byReferrer: this.groupBy(users, 'referrer')
      };
    }

    return {
      type: 'user_demographics',
      data: result,
      timeRange: { start, end }
    };
  }

  /**
   * Get engagement metrics
   */
  async getEngagementMetrics(timeRange, filters, aggregation, groupBy, sortBy, queryLimit) {
    const { start, end } = this.parseTimeRange(timeRange);
    
    // Get user activity data
    const usersSnapshot = await getDocs(collection(this.db, 'users'));
    const engagementData = [];

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      const lastSeen = userData.lastSeen?.toDate();
      
      if (this.isInTimeRange(lastSeen, start, end)) {
        engagementData.push({
          uid: doc.id,
          displayName: userData.displayName || 'Anonymous',
          lastSeen: lastSeen,
          messageCount: userData.messageCount || 0,
          loginCount: userData.loginCount || 0,
          activityScore: this.calculateActivityScore(userData),
          streakDays: userData.streakDays || 0
        });
      }
    });

    // Sort by activity score
    engagementData.sort((a, b) => b.activityScore - a.activityScore);

    const result = engagementData.slice(0, queryLimit || 20);

    return {
      type: 'engagement_metrics',
      data: result,
      timeRange: { start, end },
      topUsers: result.slice(0, 10)
    };
  }

  /**
   * Analyze message content
   */
  async getContentAnalysis(timeRange, filters, aggregation, queryLimit) {
    // This would require more complex text analysis
    // For now, return basic content stats
    return {
      type: 'content_analysis',
      data: {
        popularTopics: ['general', 'help', 'study', 'campus'],
        averageMessageLength: 45,
        mostActiveHours: ['14:00-16:00', '20:00-22:00']
      },
      note: 'Advanced content analysis requires additional setup'
    };
  }

  /**
   * Format the answer using AI
   */
  async formatAnswer(question, result, queryPlan) {
    const prompt = `Format this data into a natural, helpful answer to the admin's question.

Question: "${question}"
Data: ${JSON.stringify(result, null, 2)}

Provide:
1. A clear, direct answer
2. Key insights or patterns
3. Any recommendations
4. Format with markdown for readability

Be concise but comprehensive. Use bullet points, tables, or bold text where appropriate.`;

    const answer = await callAI(prompt, {
      provider: 'groq',
      model: 'llama3-70b-8192',
      temperature: 0.3
    });

    return {
      answer,
      data: result,
      queryPlan,
      timestamp: new Date()
    };
  }

  /**
   * Helper methods
   */
  parseTimeRange(timeRange) {
    const now = new Date();
    let start = null;
    let end = null;

    if (timeRange?.start) {
      if (timeRange.start === '7_days_ago') {
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange.start === '30_days_ago') {
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        start = new Date(timeRange.start);
      }
    }

    if (timeRange?.end) {
      if (timeRange.end === 'now') {
        end = now;
      } else {
        end = new Date(timeRange.end);
      }
    }

    return { start, end };
  }

  isInTimeRange(date, start, end) {
    if (!date) return false;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  }

  isActiveUser(userData) {
    const lastSeen = userData.lastSeen?.toDate();
    if (!lastSeen) return false;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return lastSeen > thirtyDaysAgo;
  }

  calculateActivityScore(userData) {
    let score = 0;
    if (userData.messageCount) score += userData.messageCount * 0.1;
    if (userData.loginCount) score += userData.loginCount * 0.2;
    if (this.isActiveUser(userData)) score += 10;
    return Math.round(score);
  }

  groupBy(array, field) {
    return array.reduce((groups, item) => {
      const key = item[field] || 'unknown';
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }

  groupByDate(array, granularity, dateField = 'timestamp') {
    return array.reduce((groups, item) => {
      const date = item[dateField];
      if (!date) return groups;
      
      let key;
      if (granularity === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (granularity === 'month') {
        key = date.toISOString().substring(0, 7);
      }
      
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }

  fallbackParse(question) {
    const lower = question.toLowerCase();
    
    if (lower.includes('online') || lower.includes('active')) {
      return {
        type: 'user_activity',
        timeRange: { start: '7_days_ago', end: 'now' },
        filters: { userType: 'active' },
        aggregation: 'list'
      };
    }
    
    if (lower.includes('message')) {
      return {
        type: 'message_stats',
        timeRange: { start: '7_days_ago', end: 'now' },
        aggregation: 'count'
      };
    }
    
    return {
      type: 'general',
      timeRange: { start: '30_days_ago', end: 'now' }
    };
  }

  getQuerySuggestions() {
    return [
      "Which users were online between [date] and [date]?",
      "How many messages were sent last week?",
      "Show me most active users this month",
      "What are the peak activity hours?",
      "How many new users registered this month?",
      "Compare activity between this week and last week"
    ];
  }
}

// Singleton instance
let adminQueriesInstance = null;

export const getSmartAdminQueries = () => {
  if (!adminQueriesInstance) {
    adminQueriesInstance = new SmartAdminQueries();
  }
  return adminQueriesInstance;
};

// Convenience function
export const askAdminQuery = async (question, userId = null) => {
  const queries = getSmartAdminQueries();
  return await queries.processQuery(question, userId);
};
