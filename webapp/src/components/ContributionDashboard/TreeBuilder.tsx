import { useState, use, type ReactNode } from "react";
import { RootContext } from "../../contextData/RootContext";
import { Button } from "../sharedComponents/Button";
import { CollapseToggle } from "../Search/CollapseToggle";
import { DataField } from "./DataField";
import { FacultyFields } from "./fields/FacultyFields";
import { StudyProgramFields } from "./fields/StudyProgramFields";
import { TrackFields } from "./fields/TrackFields";
import { LEVEL_GUIDE, LEVEL_TEXT } from "../../utils/levelColors";
import {
  emptyFaculty,
  emptyStudyProgram,
  emptyTrack,
  removeAt,
  replaceAt,
  setDraftField,
} from "./utils/treeDrafts";

import type { EntityLevel } from "../../utils/levelColors";
import type {
  FacultyDraft,
  StudyProgramDraft,
  TrackDraft,
} from "./utils/treeDrafts";

function BuilderCard({
  name,
  level,
  onRemove,
  children,
}: {
  name: string | undefined;
  level: EntityLevel;
  onRemove: () => void;
  children: ReactNode;
}) {
  const { t } = use(RootContext);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="rounded-lg border border-(--border-color) bg-(--surface-2)">
      <div className="flex items-center justify-between gap-2 px-2 py-1.5">
        <span
          className={`text-xs font-semibold truncate ${
            name ? "" : "italic"
          } ${LEVEL_TEXT[level]}`}
        >
          {name?.trim() ? name : t("contribution.builder.unnamed")}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          <CollapseToggle
            collapsed={collapsed}
            onClick={() => {
              setCollapsed((prev) => !prev);
            }}
            t={t}
          />
          <Button
            type="button"
            variant="danger"
            className="px-2.5 py-1.5 sm:px-2 sm:py-1 text-xs"
            onClick={onRemove}
          >
            {t("contribution.builder.remove")}
          </Button>
        </span>
      </div>
      {!collapsed && (
        <div className="flex flex-col gap-3 border-t border-(--border-color) p-2 sm:p-3">
          {children}
        </div>
      )}
    </div>
  );
}

function AddChildButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      className="px-3 py-2 sm:py-1.5 text-xs w-full sm:w-auto sm:self-start"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function TrackListEditor({
  tracks,
  onChange,
  idPrefix,
}: {
  tracks: TrackDraft[];
  onChange: (tracks: TrackDraft[]) => void;
  idPrefix: string;
}) {
  const { t } = use(RootContext);

  const updateTrack = (index: number, track: TrackDraft) => {
    onChange(replaceAt(tracks, index, track));
  };

  return (
    <div className={`flex flex-col gap-2 pl-2 sm:pl-3 ${LEVEL_GUIDE.TRACK}`}>
      <p className={`text-xs font-semibold ${LEVEL_TEXT.TRACK}`}>
        {t("admin.trackCount")} ({tracks.length})
      </p>
      {tracks.map((track, index) => (
        <BuilderCard
          key={track.id}
          name={track.data.name}
          level="TRACK"
          onRemove={() => {
            onChange(removeAt(tracks, index));
          }}
        >
          <DataField
            label={t("contribution.dataFields.name")}
            id={`${idPrefix}T${index.toString()}Name`}
            type="text"
            required
            value={track.data.name ?? ""}
            onChange={(e) => {
              updateTrack(index, {
                ...track,
                data: setDraftField(track.data, "name", e.target.value),
              });
            }}
          />
          <TrackFields
            data={track.data}
            idPrefix={`${idPrefix}T${index.toString()}`}
            setDataField={(field, value) => {
              updateTrack(index, {
                ...track,
                data: setDraftField(track.data, field, value),
              });
            }}
          />
        </BuilderCard>
      ))}
      <AddChildButton
        label={t("contribution.builder.addTrack")}
        onClick={() => {
          onChange([...tracks, emptyTrack()]);
        }}
      />
    </div>
  );
}

function StudyProgramListEditor({
  studyPrograms,
  onChange,
  idPrefix,
}: {
  studyPrograms: StudyProgramDraft[];
  onChange: (studyPrograms: StudyProgramDraft[]) => void;
  idPrefix: string;
}) {
  const { t } = use(RootContext);

  const updateProgram = (index: number, program: StudyProgramDraft) => {
    onChange(replaceAt(studyPrograms, index, program));
  };

  return (
    <div
      className={`flex flex-col gap-2 pl-2 sm:pl-3 ${LEVEL_GUIDE.STUDY_PROGRAM}`}
    >
      <p className={`text-xs font-semibold ${LEVEL_TEXT.STUDY_PROGRAM}`}>
        {t("admin.studyProgramCount")} ({studyPrograms.length})
      </p>
      {studyPrograms.map((program, index) => (
        <BuilderCard
          key={program.id}
          name={program.data.name}
          level="STUDY_PROGRAM"
          onRemove={() => {
            onChange(removeAt(studyPrograms, index));
          }}
        >
          <DataField
            label={t("contribution.dataFields.name")}
            id={`${idPrefix}P${index.toString()}Name`}
            type="text"
            required
            value={program.data.name ?? ""}
            onChange={(e) => {
              updateProgram(index, {
                ...program,
                data: setDraftField(program.data, "name", e.target.value),
              });
            }}
          />
          <StudyProgramFields
            data={program.data}
            typeOfChange="CREATE"
            idPrefix={`${idPrefix}P${index.toString()}`}
            setDataField={(field, value) => {
              updateProgram(index, {
                ...program,
                data: setDraftField(program.data, field, value),
              });
            }}
          />
          <TrackListEditor
            tracks={program.tracks}
            idPrefix={`${idPrefix}P${index.toString()}`}
            onChange={(tracks) => {
              updateProgram(index, { ...program, tracks });
            }}
          />
        </BuilderCard>
      ))}
      <AddChildButton
        label={t("contribution.builder.addStudyProgram")}
        onClick={() => {
          onChange([...studyPrograms, emptyStudyProgram()]);
        }}
      />
    </div>
  );
}

function FacultyListEditor({
  faculties,
  onChange,
}: {
  faculties: FacultyDraft[];
  onChange: (faculties: FacultyDraft[]) => void;
}) {
  const { t } = use(RootContext);

  const updateFaculty = (index: number, faculty: FacultyDraft) => {
    onChange(replaceAt(faculties, index, faculty));
  };

  return (
    <div className={`flex flex-col gap-2 pl-2 sm:pl-3 ${LEVEL_GUIDE.FACULTY}`}>
      <p className={`text-xs font-semibold ${LEVEL_TEXT.FACULTY}`}>
        {t("admin.facultyCount")} ({faculties.length})
      </p>
      {faculties.map((faculty, index) => (
        <BuilderCard
          key={faculty.id}
          name={faculty.data.name}
          level="FACULTY"
          onRemove={() => {
            onChange(removeAt(faculties, index));
          }}
        >
          <DataField
            label={t("contribution.dataFields.name")}
            id={`F${index.toString()}Name`}
            type="text"
            required
            value={faculty.data.name ?? ""}
            onChange={(e) => {
              updateFaculty(index, {
                ...faculty,
                data: setDraftField(faculty.data, "name", e.target.value),
              });
            }}
          />
          <FacultyFields
            data={faculty.data}
            idPrefix={`F${index.toString()}`}
            setDataField={(field, value) => {
              updateFaculty(index, {
                ...faculty,
                data: setDraftField(faculty.data, field, value),
              });
            }}
          />
          <StudyProgramListEditor
            studyPrograms={faculty.studyPrograms}
            idPrefix={`F${index.toString()}`}
            onChange={(studyPrograms) => {
              updateFaculty(index, { ...faculty, studyPrograms });
            }}
          />
        </BuilderCard>
      ))}
      <AddChildButton
        label={t("contribution.builder.addFaculty")}
        onClick={() => {
          onChange([...faculties, emptyFaculty()]);
        }}
      />
    </div>
  );
}

export { FacultyListEditor, StudyProgramListEditor, TrackListEditor };
