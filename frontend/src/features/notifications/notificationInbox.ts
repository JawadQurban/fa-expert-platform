import type { MyNotificationDto } from './notification.types';

/**
 * «Seen» for the header bell. `NOTIFICATION_LOG` is append-only and has no
 * read state (`DM-GAP-08`), so the platform cannot mark a notification read.
 * What the bell can honestly count is what arrived since this person last
 * opened «إشعاراتي» — kept in this browser only, a per-viewer convenience.
 * ponytail: per-browser, so another device shows the same items as new; a
 * server read-state table replaces this when the Academy decides one.
 */
const LAST_SEEN_KEY = 'expert-hub.notifications.last-seen';

export function readLastSeen(): string | null {
  try {
    return window.localStorage.getItem(LAST_SEEN_KEY);
  } catch {
    return null;
  }
}

export function markSeen(items: readonly MyNotificationDto[]): void {
  const newest = items[0]?.sentAt;
  if (newest == null) {
    return;
  }
  try {
    window.localStorage.setItem(LAST_SEEN_KEY, newest);
  } catch {
    // Storage blocked (private window): the bell keeps counting — harmless.
  }
}

/** How many arrived after `lastSeen`; everything, when nothing was ever seen. */
export function countUnread(items: readonly MyNotificationDto[], lastSeen: string | null): number {
  const since = lastSeen == null ? Number.NEGATIVE_INFINITY : Date.parse(lastSeen);
  return items.filter((item) => Date.parse(item.sentAt) > since).length;
}
