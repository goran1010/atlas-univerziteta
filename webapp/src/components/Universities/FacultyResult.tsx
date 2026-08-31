import { ResultCard } from "./ResultCard";

import type { FacultySearchResult } from "../../schemas/university";

function FacultyResult({ faculty }: { faculty: FacultySearchResult }) {
  return (
    <ResultCard>
      <p className="font-bold text-(--text-primary)">{faculty.name}</p>
      {faculty.city && (
        <p className="text-sm text-(--text-secondary) mt-1">
          <span aria-hidden="true">📍</span> {faculty.city}
        </p>
      )}
    </ResultCard>
  );
}

export { FacultyResult };
