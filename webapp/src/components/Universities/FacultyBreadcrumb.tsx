function FacultyBreadcrumb({
  faculty,
}: {
  faculty: {
    name: string;
    university: { name: string; acronym?: string | null };
  };
}) {
  return (
    <p className="text-sm text-(--text-muted) mt-1">
      <span aria-hidden="true">🏛️</span> {faculty.name}
      {" - "}
      {faculty.university.name}
      {faculty.university.acronym && ` (${faculty.university.acronym})`}
    </p>
  );
}

export { FacultyBreadcrumb };
