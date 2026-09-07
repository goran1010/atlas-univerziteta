import {
  AwardIcon,
  ClockIcon,
  MapPinIcon,
  SpeechIcon,
  TagIcon,
  LandmarkIcon,
  BuildingIcon,
  BookOpenIcon,
  ClipboardListIcon,
} from "../sharedComponents/icons";
import { use } from "react";
import type { ReactNode } from "react";
import { RootContext } from "../../contextData/RootContext";
import { ContactLinks } from "./ContactLinks";
import { tCount } from "../../utils/pluralize";

import type {
  UniversityDetail,
  UniversityDetailFaculty,
  UniversityDetailStudyProgram,
  UniversityDetailTrack,
} from "../../schemas/university";
import type { EntityAncestors } from "./types";

function DetailSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-(--border-color) bg-(--surface-2) p-2 sm:p-3">
      <p className="text-xs font-semibold text-(--text-secondary) flex items-center gap-1">
        <span aria-hidden="true">{icon}</span> {title}
      </p>
      <div className="text-sm text-(--text-primary)">{children}</div>
    </div>
  );
}

function UniversitySection({ university }: { university: UniversityDetail }) {
  const { t } = use(RootContext);
  return (
    <DetailSection
      icon={<LandmarkIcon />}
      title={t("contribution.entityTypes.UNIVERSITY")}
    >
      <p className="font-semibold">{university.name}</p>
      {university.acronym && (
        <p className="text-xs text-(--text-muted)">({university.acronym})</p>
      )}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-(--text-muted)">
        <span>
          <MapPinIcon /> {university.city}
        </span>
        <span>
          <TagIcon /> {t(`universitiesPage.entities.${university.entity}`)}
        </span>
        <span>{t(`universitiesPage.ownership.${university.ownership}`)}</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-(--text-muted)">
        <ContactLinks
          website={university.website}
          address={university.address}
          phone={university.phone}
          email={university.email}
        />
      </div>
    </DetailSection>
  );
}

function FacultySection({ faculty }: { faculty: UniversityDetailFaculty }) {
  const { t } = use(RootContext);
  return (
    <DetailSection
      icon={<BuildingIcon />}
      title={t("contribution.entityTypes.FACULTY")}
    >
      <p className="font-semibold">{faculty.name}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-(--text-muted)">
        <ContactLinks
          website={faculty.website}
          address={faculty.address}
          phone={faculty.phone}
          email={faculty.email}
        />
      </div>
    </DetailSection>
  );
}

function StudyProgramSection({
  program,
}: {
  program: UniversityDetailStudyProgram;
}) {
  const { t } = use(RootContext);
  return (
    <DetailSection
      icon={<BookOpenIcon />}
      title={t("contribution.entityTypes.STUDY_PROGRAM")}
    >
      <p className="font-semibold">{program.name}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-(--text-muted)">
        <span>{t(`universitiesPage.cycles.${program.cycle}`)}</span>
        {program.durationYears != null && (
          <span>
            <ClockIcon /> {program.durationYears}{" "}
            {tCount(t, "universitiesPage.durationYears", program.durationYears)}
          </span>
        )}
        {program.ects != null && (
          <span>
            <AwardIcon /> {program.ects} {t("universitiesPage.ects")}
          </span>
        )}
        {program.language && (
          <span>
            <SpeechIcon /> {program.language}
          </span>
        )}
      </div>
    </DetailSection>
  );
}

function TrackSection({ track }: { track: UniversityDetailTrack }) {
  const { t } = use(RootContext);
  return (
    <DetailSection
      icon={<ClipboardListIcon />}
      title={t("contribution.entityTypes.TRACK")}
    >
      <p className="font-semibold">{track.name}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-(--text-muted)">
        {track.durationYears != null && (
          <span>
            <ClockIcon /> {track.durationYears}{" "}
            {tCount(t, "universitiesPage.durationYears", track.durationYears)}
          </span>
        )}
        {track.ects != null && (
          <span>
            <AwardIcon /> {track.ects} {t("universitiesPage.ects")}
          </span>
        )}
      </div>
    </DetailSection>
  );
}

function EntityDetailContent({
  ancestors,
  track,
}: {
  ancestors: EntityAncestors;
  track?: UniversityDetailTrack;
}) {
  return (
    <div className="flex flex-col gap-3">
      <UniversitySection university={ancestors.university} />
      {ancestors.faculty && <FacultySection faculty={ancestors.faculty} />}
      {ancestors.studyProgram && (
        <StudyProgramSection program={ancestors.studyProgram} />
      )}
      {track && <TrackSection track={track} />}
    </div>
  );
}

export { EntityDetailContent };
