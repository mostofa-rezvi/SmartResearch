import { evaluateSpam } from './trustrank-moderation';

export interface Thread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorTrustRank: number;
  upvotes: number;
  isSpam: boolean;
  replies: Reply[];
}

export interface Reply {
  id: string;
  content: string;
  authorId: string;
  authorTrustRank: number;
  isSpam: boolean;
}

export class ForumService {
  private static threads: Thread[] = [];

  static async getThreads() {
    // Sort by TrustRank-weighted upvotes
    return [...this.threads]
      .filter(t => !t.isSpam)
      .sort((a, b) => {
        const scoreA = a.upvotes * (a.authorTrustRank / 100);
        const scoreB = b.upvotes * (b.authorTrustRank / 100);
        return scoreB - scoreA;
      });
  }

  static async createThread(data: Partial<Thread>) {
    // SECURITY: Fetch TrustRank from session/DB, DO NOT trust user input
    const userTrustRank = 50; // Mocked DB lookup
    const { isSpam } = evaluateSpam(data.content || '', userTrustRank);
    
    const newThread: Thread = {
      id: crypto.randomUUID(),
      title: data.title || '',
      content: data.content || '',
      authorId: data.authorId || 'anonymous',
      authorTrustRank: userTrustRank,
      upvotes: 0,
      isSpam: isSpam,
      replies: [],
    };
    this.threads.push(newThread);
    return newThread;
  }

  static async addReply(threadId: string, data: Partial<Reply>) {
    const thread = this.threads.find(t => t.id === threadId);
    if (!thread) throw new Error('Thread not found');
    
    // SECURITY: Fetch TrustRank from session/DB
    const userTrustRank = 50; // Mocked DB lookup
    const { isSpam } = evaluateSpam(data.content || '', userTrustRank);
    
    const newReply: Reply = {
      id: crypto.randomUUID(),
      content: data.content || '',
      authorId: data.authorId || 'anonymous',
      authorTrustRank: userTrustRank,
      isSpam: isSpam,
    };
    thread.replies.push(newReply);
    return newReply;
  }

  static async upvote(threadId: string) {
    const thread = this.threads.find(t => t.id === threadId);
    if (thread) thread.upvotes++;
  }
}
