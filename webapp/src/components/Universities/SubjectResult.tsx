import type { TFunction } from "../../types/i18n";
import type { SubjectSearchResult } from "../../schemas/university";

function SubjectResult({
  subject,
  t,
}: {
  subject: SubjectSearchResult;
  t: TFunction;
}) {
  return (
    <li className="border border-(--border-color) rounded-lg p-3 bg-(--surface-2) hover:bg-(--hover-surface) transition-colors">
      <p className="font-bold text-(--text-primary)">{subject.name}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm text-(--text-secondary)">
        {subject.semester != null && (
          <span>
            {t("universitiesPage.semester")} {subject.semester}
          </span>
        )}
        {subject.ects != null && (
          <span>
            {subject.ects} {t("universitiesPage.ects")}
          </span>
        )}
        {subject.type && (
          <span>{t(`universitiesPage.subjectTypes.${subject.type}`)}</span>
        )}
      </div>
      <p className="text-sm text-(--text-muted) mt-1">
        {subject.studyProgram.name}
        <span className="text-(--text-muted)">
          {" - "}
          {subject.studyProgram.faculty.name}
          {", "}
          {subject.studyProgram.faculty.university.name}
          {subject.studyProgram.faculty.university.acronym &&
            ` (${subject.studyProgram.faculty.university.acronym})`}
        </span>
      </p>
    </li>
  );
}

export { SubjectResult };
