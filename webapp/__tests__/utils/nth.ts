// Indexed access types as possibly undefined under noUncheckedIndexedAccess;
// tests want a hard failure with a clear message instead of optional chaining.
function nth<T>(items: readonly T[], index = 0): T {
  const item = items.at(index);
  if (item === undefined) {
    throw new Error(
      `Expected an element at index ${String(index)}, but there are ${String(items.length)}.`,
    );
  }
  return item;
}

export { nth };
