/**
 * Groups an array of items by a key function, preserving the order
 * of the first occurrence of each key.
 */
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
