// Usage Limiter for Tavily API
// Tracks daily usage to conserve API credits

const STORAGE_KEY = 'tavily_usage';
const DAILY_LIMIT = 10; // Maximum searches per day (conservative to preserve 100 credits)

export const UsageLimiter = {
  // Get today's date string (YYYY-MM-DD)
  getToday() {
    return new Date().toISOString().split('T')[0];
  },

  // Get current usage data
  getUsage() {
    if (typeof window === 'undefined') return { date: this.getToday(), count: 0 };
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return { date: this.getToday(), count: 0 };
      }
      
      const usage = JSON.parse(stored);
      
      // Reset if it's a new day
      if (usage.date !== this.getToday()) {
        this.resetUsage();
        return { date: this.getToday(), count: 0 };
      }
      
      return usage;
    } catch (error) {
      console.error('Error reading usage:', error);
      return { date: this.getToday(), count: 0 };
    }
  },

  // Increment usage count
  incrementUsage() {
    if (typeof window === 'undefined') return;
    
    try {
      const usage = this.getUsage();
      usage.count += 1;
      usage.date = this.getToday();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
    } catch (error) {
      console.error('Error saving usage:', error);
    }
  },

  // Reset usage (called automatically on new day)
  resetUsage() {
    if (typeof window === 'undefined') return;
    
    try {
      const usage = { date: this.getToday(), count: 0 };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
    } catch (error) {
      console.error('Error resetting usage:', error);
    }
  },

  // Check if usage limit is reached
  isLimitReached() {
    const usage = this.getUsage();
    return usage.count >= DAILY_LIMIT;
  },

  // Get remaining searches
  getRemaining() {
    const usage = this.getUsage();
    return Math.max(0, DAILY_LIMIT - usage.count);
  },

  // Get usage percentage
  getUsagePercentage() {
    const usage = this.getUsage();
    return (usage.count / DAILY_LIMIT) * 100;
  },

  // Check if approaching limit (80% threshold)
  isApproachingLimit() {
    return this.getUsagePercentage() >= 80;
  },

  // Get daily limit
  getDailyLimit() {
    return DAILY_LIMIT;
  }
};

