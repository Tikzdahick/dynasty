// In-app notifications feed (auction sales/outbids, moment drops, daily ready,
// rival challenges). Local-first; swap for a server feed when multiplayer lands.
const KEY = "dynasty.notifications";
const MAX = 60;

export type NotifType =
  | "auction"
  | "outbid"
  | "moment"
  | "daily"
  | "rival"
  | "reward"
  | "info";

export interface Notification {
  id: string;
  type: NotifType;
  text: string;
  ts: number;
  read: boolean;
}

const EMOJI: Record<NotifType, string> = {
  auction: "💰",
  outbid: "⚠️",
  moment: "🔥",
  daily: "🎁",
  rival: "⚔️",
  reward: "🏅",
  info: "ℹ️",
};

export function notifEmoji(type: NotifType): string {
  return EMOJI[type] ?? "ℹ️";
}

export function getNotifications(): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as Notification[];
  } catch {
    return [];
  }
}

export function unreadCount(): number {
  return getNotifications().filter((n) => !n.read).length;
}

/** Add a notification, de-duping the exact same text within the last minute. */
export function pushNotification(type: NotifType, text: string) {
  if (typeof window === "undefined") return;
  const all = getNotifications();
  const now = Date.now();
  if (all.some((n) => n.text === text && now - n.ts < 60_000)) return;
  all.unshift({ id: `n_${now}_${Math.random().toString(36).slice(2, 6)}`, type, text, ts: now, read: false });
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, MAX)));
}

export function markAllRead() {
  if (typeof window === "undefined") return;
  const all = getNotifications().map((n) => ({ ...n, read: true }));
  localStorage.setItem(KEY, JSON.stringify(all));
}
