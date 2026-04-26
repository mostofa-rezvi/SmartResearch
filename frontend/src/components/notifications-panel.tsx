"use client";

import React, { useState } from "react";
import { Bell, CheckCircle2, UserPlus, FileText } from "lucide-react";

export function NotificationsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  const notifications = [
    { id: 1, type: 'invite', text: 'Dr. Smith invited you to "Quantum ML Project"', unread: true },
    { id: 2, type: 'mention', text: 'Elena mentioned you in "Methodology Draft"', unread: true },
    { id: 3, type: 'update', text: 'Task "Data Collection" marked as Done', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-primary"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white dark:border-slate-900" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-bold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{unreadCount} New</span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((n) => (
              <div key={n.id} className={`p-4 border-b last:border-0 border-slate-100 dark:border-slate-800 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${n.unread ? 'bg-primary/5' : ''}`}>
                <div className={`mt-0.5 shrink-0 ${n.type === 'invite' ? 'text-emerald-500' : n.type === 'mention' ? 'text-primary' : 'text-slate-400'}`}>
                  {n.type === 'invite' ? <UserPlus size={16} /> : n.type === 'mention' ? <FileText size={16} /> : <CheckCircle2 size={16} />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${n.unread ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{n.text}</p>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">2 hours ago</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
