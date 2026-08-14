"use client";

/**
 * ConnectButton — send / manage a collaboration connection with another
 * researcher. Reflects the live connection status and adapts:
 *   none/rejected        → "Connect"          (sends a request)
 *   pending (I sent)     → "Request sent"      (hover to cancel)
 *   pending (I received) → "Accept" / dismiss  (respond to their request)
 *   accepted             → "Connected"         (hover to disconnect)
 *
 * Backed by /api/v1/connections/*.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useApi } from "@/context/AuthContext";
import { API } from "@/config/api";
import { UserPlus, Clock, Check, X, UserCheck, Loader2 } from "lucide-react";

type Status = "none" | "pending" | "accepted" | "rejected";
interface StatusData {
  status: Status;
  connection_id?: number;
  i_am_requester?: boolean;
}

export default function ConnectButton({
  targetUserId,
  className = "",
  onChange,
}: {
  targetUserId: string | number;
  className?: string;
  onChange?: () => void;
}) {
  const { fetchWithAuth } = useApi();
  const [data, setData] = useState<StatusData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchWithAuth(API.connections.status(String(targetUserId)));
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      /* leave previous state */
    }
  }, [fetchWithAuth, targetUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const after = async () => {
    await load();
    onChange?.();
  };

  const connect = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithAuth(API.connections.request, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient_id: targetUserId,
          message: "Hi! I'd love to connect and collaborate on ResearchBridge.",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok || res.status === 409) await after();
      else setError(json.message || "Could not send request");
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  const respond = async (action: "accept" | "reject") => {
    if (!data?.connection_id) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithAuth(API.connections.respond(String(data.connection_id)), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) await after();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!data?.connection_id) return;
    setBusy(true);
    try {
      const res = await fetchWithAuth(API.connections.remove(String(data.connection_id)), { method: "DELETE" });
      if (res.ok) await after();
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  if (!data) return null; // status still loading

  const base = "px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-60";

  // Incoming request → accept / dismiss
  if (data.status === "pending" && data.i_am_requester === false) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Wants to connect</span>
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => respond("accept")} className={`${base} bg-primary text-white shadow-lg shadow-primary/20 hover:bg-secondary flex-1`}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Accept
          </button>
          <button disabled={busy} onClick={() => respond("reject")} className={`${base} neu-btn text-slate-500 px-3`} title="Dismiss">
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Outgoing request → sent (hover to cancel)
  if (data.status === "pending" && data.i_am_requester) {
    return (
      <button disabled={busy} onClick={remove} className={`${base} neu-btn text-slate-500 group ${className}`} title="Cancel request">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
        <span className="group-hover:hidden">Request sent</span>
        <span className="hidden group-hover:inline">Cancel</span>
      </button>
    );
  }

  // Connected (hover to disconnect)
  if (data.status === "accepted") {
    return (
      <button
        disabled={busy}
        onClick={remove}
        className={`${base} bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 group ${className}`}
        title="Disconnect"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
        <span className="group-hover:hidden">Connected</span>
        <span className="hidden group-hover:inline">Disconnect</span>
      </button>
    );
  }

  // none / rejected → connect
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <button disabled={busy} onClick={connect} className={`${base} bg-primary text-white shadow-lg shadow-primary/20 hover:bg-secondary`}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} Connect
      </button>
      {error && <span className="text-[10px] text-red-500 text-center">{error}</span>}
    </div>
  );
}
