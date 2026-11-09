/** Today for a demo's starting dates, read in UTC so the server and the
 *  browser agree. A server in UTC and a viewer west of it are on different
 *  days for part of every day; dates seeded from `new Date()` then render
 *  differently on each side, hydration fails, and React re-renders the whole
 *  page (every reveal plays twice). Local midnight of the UTC day. */
export function demoToday(): Date {
  const now = new Date();
  return new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}
