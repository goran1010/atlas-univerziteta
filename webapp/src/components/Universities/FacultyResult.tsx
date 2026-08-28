import type { TFunction } from "../../types/i18n";
import type { FacultySearchResult } from "../../schemas/university";

function FacultyResult({
  faculty,
  t,
}: {
  faculty: FacultySearchResult;
  t: TFunction;
}) {
  return (
    <li className="border border-(--border-color) rounded-lg p-3 bg-(--surface-2) hover:bg-(--hover-surface) transition-colors">
      <p className="font-bold text-(--text-primary)">{faculty.name}</p>
      {faculty.city && (
        <p className="text-sm text-(--text-secondary) mt-1">
          {t("universitiesPage.city")}: {faculty.city}
        </p>
      )}
      <p className="text-sm text-(--text-muted) mt-1">
        {faculty.university.name}
        {faculty.university.acronym && ` (${faculty.university.acronym})`}
      </p>
    </li>
  );
}

export { FacultyResult };
