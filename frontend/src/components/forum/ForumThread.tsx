import React from 'react';
import { TrustRankBadge } from './TrustRankBadge';
import { SpamAlert } from './SpamAlert';

export const ForumThread = ({ thread }: { thread: any }) => {
  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      {thread.isSpam && <SpamAlert />}
      
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold">User {thread.authorId}</span>
            <TrustRankBadge rank={thread.authorTrustRank} />
            <span className="text-sm text-gray-500">• 2h ago</span>
          </div>
          <h3 className="text-lg font-bold mb-2">{thread.title}</h3>
          <p className="text-gray-700 leading-relaxed">{thread.content}</p>
        </div>
      </div>

      <div className="flex items-center gap-6 pt-4 border-t text-sm text-gray-500">
        <button className="flex items-center gap-1.5 hover:text-blue-600">
          <span>▲</span>
          <span>{thread.upvotes} Upvotes</span>
        </button>
        <button className="hover:text-blue-600">
          {thread.replies.length} Replies
        </button>
        <button className="hover:text-blue-600">Share</button>
      </div>

      {thread.replies.length > 0 && (
        <div className="pl-6 border-l-2 border-gray-100 space-y-6 mt-6">
          {thread.replies.map((reply: any) => (
            <div key={reply.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">User {reply.authorId}</span>
                <TrustRankBadge rank={reply.authorTrustRank} />
              </div>
              <p className="text-sm text-gray-700">{reply.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
