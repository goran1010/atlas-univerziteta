import { ResultCard } from "./ResultCard";
import { FacultyBreadcrumb } from "./FacultyBreadcrumb";

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
    <ResultCard>
      <p className="font-bold text-(--text-primary)">{program.name}</p>
      {program.ects != null && (
        <p className="mt-1 text-sm text-(--text-secondary)">
          <span aria-hidden="true">🎓</span> {program.ects}{" "}
          {t("universitiesPage.ects")}
        </p>
      )}
      <FacultyBreadcrumb faculty={program.faculty} />
    </ResultCard>
  );
}

export { StudyProgramResult };
