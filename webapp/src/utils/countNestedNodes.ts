interface TreeNodeChildren {
  faculties?: TreeNodeChildren[] | undefined;
  studyPrograms?: TreeNodeChildren[] | undefined;
  tracks?: TreeNodeChildren[] | undefined;
}

// How many nested descendants a tree CREATE payload carries (0 for a flat
// create), for the "+N in tree" badge on pending change rows. Takes `object`
// because childless create payloads (e.g. TRACK) share no keys with the tree
// shape.
function countNestedNodes(node: object): number {
  const { faculties, studyPrograms, tracks } = node as TreeNodeChildren;
  const children = [
    ...(faculties ?? []),
    ...(studyPrograms ?? []),
    ...(tracks ?? []),
  ];
  return (
    children.length +
    children.reduce((sum, child) => sum + countNestedNodes(child), 0)
  );
}

export { countNestedNodes };
