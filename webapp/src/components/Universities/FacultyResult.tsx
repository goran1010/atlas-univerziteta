import type { FacultySearchResult } from "../../schemas/university";

function FacultyResult({ faculty }: { faculty: FacultySearchResult }) {
  return (
    <li className="border border-(--border-color) rounded-lg p-3 bg-(--surface-2) hover:bg-(--hover-surface) transition-colors">
      <p className="font-bold text-(--text-primary)">{faculty.name}</p>
      {faculty.city && (
        <p className="text-sm text-(--text-secondary) mt-1">
          📍 {faculty.city}
        </p>
      )}
    </li>
  );
}

export { FacultyResult };
