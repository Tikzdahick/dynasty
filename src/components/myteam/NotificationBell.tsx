"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getNotifications,
  markAllRead,
  unreadCount,
  notifEmoji,
  Notification,
} from "@/lib/store/notifications";

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = () => {
    setItems(getNotifications());
    setUnread(unreadCount());
  };

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 4000); // pick up auction/rival events
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      markAllRead();
      setTimeout(refresh, 50);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        className="btn relative border border-white/10 bg-panel/70 px-3 text-sm text-white/80 hover:bg-white/5"
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-white/10 bg-ink/95 p-2 shadow-xl backdrop-blur-xl"
          >
            <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white/40">
              Notifications
            </div>
            {items.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-white/40">
                Nothing yet — go play, bid, and grind.
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-2 rounded-xl px-2 py-2 hover:bg-white/5"
                >
                  <span className="text-lg leading-none">{notifEmoji(n.type)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white/80">{n.text}</div>
                    <div className="text-[11px] text-white/35">{timeAgo(n.ts)}</div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
