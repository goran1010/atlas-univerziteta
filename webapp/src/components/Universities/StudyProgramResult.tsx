import type { TFunction } from "../../types/i18n";
import type { StudyProgramSearchResult } from "../../schemas/university";

function StudyProgramResult({
  program,
  t,
}: {
  program: StudyProgramSearchResult;
  t: TFunction;
}) {
  return (
    <li className="border border-(--border-color) rounded-lg p-3 bg-(--surface-2) hover:bg-(--hover-surface) transition-colors">
      <p className="font-bold text-(--text-primary)">{program.name}</p>
      {program.ects != null && (
        <p className="mt-1 text-sm text-(--text-secondary)">
          {program.ects} {t("universitiesPage.ects")}
        </p>
      )}
      <p className="text-sm text-(--text-muted) mt-1">
        {program.faculty.name}

        <span className="text-(--text-muted)">
          {" - "}
          {program.faculty.university.name}
          {program.faculty.university.acronym &&
            ` (${program.faculty.university.acronym})`}
        </span>
      </p>
    </li>
  );
}

export { StudyProgramResult };
