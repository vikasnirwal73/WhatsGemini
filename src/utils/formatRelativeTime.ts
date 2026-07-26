// Formats a past timestamp as a short relative string ("today", "3 days
// ago", "2 weeks ago"), falling back to an absolute date once it's old
// enough that a relative count stops being useful at a glance.
export const formatRelativeTime = (timestamp: number): string => {
  const diffDays = Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  return new Date(timestamp).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};
