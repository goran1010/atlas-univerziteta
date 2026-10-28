// Group order follows each key's first occurrence - result sections rely
// on the input order surviving the grouping.
function groupBy<T>(items: T[], keyFn: (item: T) => string) {
  const groups: { key: string; items: T[] }[] = [];
  const seen = new Map<string, { key: string; items: T[] }>();

  for (const item of items) {
    const key = keyFn(item);
    const group = seen.get(key);
    if (group) {
      group.items.push(item);
    } else {
      const newGroup = { key, items: [item] };
      seen.set(key, newGroup);
      groups.push(newGroup);
    }
  }

  return groups;
}

export { groupBy };
