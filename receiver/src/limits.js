/** Counts sends per visitor per hour and in total per day. Kept in memory: a restart resets it. */
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function createLimiter({ perVisitorPerHour, totalPerDay }, now = () => Date.now()) {
  const byVisitor = new Map();
  let day = { start: now(), count: 0 };

  return {
    /** Returns true and counts the request, or false when a limit is reached. */
    allow(visitor) {
      const time = now();
      if (time - day.start >= DAY) day = { start: time, count: 0 };
      const recent = (byVisitor.get(visitor) ?? []).filter((t) => time - t < HOUR);
      if (recent.length >= perVisitorPerHour || day.count >= totalPerDay) {
        byVisitor.set(visitor, recent);
        return false;
      }
      recent.push(time);
      byVisitor.set(visitor, recent);
      day.count++;
      // Keep the table small.
      if (byVisitor.size > 5000) {
        for (const [key, times] of byVisitor) if (times.every((t) => time - t >= HOUR)) byVisitor.delete(key);
      }
      return true;
    },
  };
}
