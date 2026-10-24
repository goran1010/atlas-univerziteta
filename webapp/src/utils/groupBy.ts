// Group order follows each key's first occurrence - result sections rely
// on the input order surviving the grouping.
function groupBy<T>(items: T[], keyFn: (item: T) => string) {
  const groups: { key: string; items: T[] }[] = [];
  const seen = new Map<string, number>();

  for (const item of items) {
    const key = keyFn(item);
    const idx = seen.get(key);
    if (idx !== undefined) {
      groups[idx].items.push(item);
    } else {
      seen.set(key, groups.length);
      groups.push({ key, items: [item] });
    }
  }

  return groups;
}

export { groupBy };
