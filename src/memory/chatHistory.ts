import { ChatMessage, QueryIntent, UserProfile } from '../types/index.js';

const memoryStore = new Map<string, ChatMessage[]>();
const userProfiles = new Map<string, UserProfile>();

const MAX_HISTORY = 10;

export const ChatMemory = {

  getHistory(sessionId: string): ChatMessage[] {
    if (!memoryStore.has(sessionId)) {
      memoryStore.set(sessionId, []);
    }
    return memoryStore.get(sessionId)!;
  },

  addMessage(sessionId: string, role: 'user' | 'assistant' | 'system', content: string): void {
    const history = this.getHistory(sessionId);
    history.push({ role, content, timestamp: new Date() });
    if (history.length > MAX_HISTORY) {
      history.shift();
    }
    memoryStore.set(sessionId, history);
  },

  getRecentContext(sessionId: string, limit: number = 5): string {
    return this.getHistory(sessionId)
      .slice(-limit)
      .map(h => `${h.role.toUpperCase()}: ${h.content}`)
      .join('\n');
  },

  updateUserProfile(sessionId: string, intent: QueryIntent): void {
    let profile = userProfiles.get(sessionId);

    if (!profile) {
      profile = {
        sessionId,
        searchCount: {},
        totalSearches: 0,
        createdAt: new Date(),
        lastActiveAt: new Date(),
      };
    }

    profile.lastActiveAt = new Date();
    profile.totalSearches++;

    if (intent.category) {
      profile.searchCount[intent.category] = (profile.searchCount[intent.category] ?? 0) + 1;
      const sorted = Object.entries(profile.searchCount).sort(([, a], [, b]) => b - a);
      profile.preferredCategory = sorted[0]?.[0];
    }

    if (intent.budget && intent.budget > 0) {
      profile.avgBudget = profile.avgBudget
        ? Math.round((profile.avgBudget + intent.budget) / 2)
        : intent.budget;
    }

    profile.lastIntent = intent;
    userProfiles.set(sessionId, profile);
  },

  getUserProfile(sessionId: string): UserProfile | undefined {
    return userProfiles.get(sessionId);
  },

  isReturningUser(sessionId: string): boolean {
    return (userProfiles.get(sessionId)?.totalSearches ?? 0) > 1;
  },

  getSmartRecommendations(sessionId: string): { category?: string; budget?: number } | null {
    const profile = userProfiles.get(sessionId);
    if (!profile) return null;
    return { category: profile.preferredCategory, budget: profile.avgBudget };
  },

  clearHistory(sessionId: string): void {
    memoryStore.delete(sessionId);
    userProfiles.delete(sessionId);
  },

  getStats(sessionId: string): object {
    const history = this.getHistory(sessionId);
    const profile = userProfiles.get(sessionId);
    return {
      totalMessages: history.length,
      totalSearches: profile?.totalSearches ?? 0,
      preferredCategory: profile?.preferredCategory,
      avgBudget: profile?.avgBudget,
      isReturning: this.isReturningUser(sessionId),
    };
  },
};