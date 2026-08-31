import { useEffect, useRef, useState, use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { Select } from "../sharedComponents/Select";
import { Label } from "../sharedComponents/Label";
import { Spinner } from "../../utils/Spinner";
import { SelectedEntityDetails } from "./SelectedEntityDetails";
import { SERVER_URL } from "../../utils/envConfig";
import { readErrorMessage } from "../../schemas/api";
import {
  universityDetailResponseSchema,
  universityListResponseSchema,
} from "../../schemas/university";

import type { ReactNode } from "react";
import type {
  UniversityDetail,
  UniversityDetailFaculty,
  UniversityDetailStudyProgram,
  UniversityDetailTrack,
  UniversityListItem,
} from "../../schemas/university";
export type PickedEntity =
  | { type: "UNIVERSITY"; data: UniversityListItem }
  | { type: "FACULTY"; data: UniversityDetailFaculty }
  | { type: "STUDY_PROGRAM"; data: UniversityDetailStudyProgram }
  | { type: "TRACK"; data: UniversityDetailTrack };

interface LevelSelectProps {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  emptyMessage: string;
  placeholder: string;
  options: { id: number; label: string }[];
  onChange: (value: string) => void;
}

function LevelSelect({
  id,
  label,
  value,
  disabled,
  emptyMessage,
  placeholder,
  options,
  onChange,
}: LevelSelectProps) {
  const isEmpty = !disabled && options.length === 0;
  return (
    <div className="flex flex-col gap-1 items-center">
      <Label htmlFor={id} required={!disabled && !isEmpty}>
        {label}
      </Label>
      <Select
        id={id}
        name={id}
        value={value}
        disabled={disabled || isEmpty}
        required
        onChange={(e) => {
          onChange(e.target.value);
        }}
      >
        <option value="">{isEmpty ? emptyMessage : placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

interface EntityPickerProps {
  depth: number;
  legend: string;
  showSelectedDetails: boolean;
  onSelect: (id: string) => void;
}

function EntityPicker({
  depth,
  legend,
  showSelectedDetails,
  onSelect,
}: EntityPickerProps) {
  const { t, addNotification } = use(RootContext);

  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });

  const [universities, setUniversities] = useState<UniversityListItem[]>([]);
  const [detail, setDetail] = useState<UniversityDetail | undefined>(undefined);
  const [selUniversity, setSelUniversity] = useState("");
  const [selFaculty, setSelFaculty] = useState("");
  const [selProgram, setSelProgram] = useState("");
  const [selTrack, setSelTrack] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    async function fetchUniversities() {
      try {
        setLoadingList(true);
        const res = await fetch(`${SERVER_URL}/api/v1/universities`, {
          method: "GET",
          mode: "cors",
        });

        if (res.ok) {
          const result = universityListResponseSchema.parse(await res.json());
          setUniversities(result.data);
        } else {
          const serverMessage = readErrorMessage(await res.json());
          if (serverMessage) {
            console.warn("Failed to load universities:", serverMessage);
          }
          addNotification({
            type: "error",
            message: tRef.current("messages.universities.loadError"),
          });
        }
      } catch {
        addNotification({
          type: "error",
          message: tRef.current("messages.universities.loadError"),
        });
      } finally {
        setLoadingList(false);
      }
    }
    void fetchUniversities();
  }, [addNotification]);

  async function handleUniversityChange(value: string) {
    setSelUniversity(value);
    setSelFaculty("");
    setSelProgram("");
    setSelTrack("");
    setDetail(undefined);
    onSelect(depth === 1 ? value : "");
    if (!value || depth === 1) return;

    try {
      setLoadingDetail(true);
      const res = await fetch(`${SERVER_URL}/api/v1/universities/${value}`, {
        method: "GET",
        mode: "cors",
      });

      if (res.ok) {
        const result = universityDetailResponseSchema.parse(await res.json());
        setDetail(result.data);
      } else {
        const serverMessage = readErrorMessage(await res.json());
        if (serverMessage) {
          console.warn("Failed to load university details:", serverMessage);
        }
        addNotification({
          type: "error",
          message: t("messages.universities.detailsError"),
        });
      }
    } catch {
      addNotification({
        type: "error",
        message: t("messages.universities.detailsError"),
      });
    } finally {
      setLoadingDetail(false);
    }
  }

  function handleFacultyChange(value: string) {
    setSelFaculty(value);
    setSelProgram("");
    setSelTrack("");
    onSelect(depth === 2 ? value : "");
  }

  function handleProgramChange(value: string) {
    setSelProgram(value);
    setSelTrack("");
    onSelect(depth === 3 ? value : "");
  }

  function handleTrackChange(value: string) {
    setSelTrack(value);
    onSelect(value);
  }

  const faculties = detail?.faculties ?? [];
  const studyPrograms =
    faculties.find((f) => String(f.id) === selFaculty)?.studyPrograms ?? [];
  const selectedProgram = studyPrograms.find(
    (sp) => String(sp.id) === selProgram,
  );
  const leafOptions = selectedProgram?.tracks ?? [];

  let pickedEntity: PickedEntity | undefined;
  if (depth === 1 && selUniversity) {
    const university = universities.find((u) => String(u.id) === selUniversity);
    if (university) pickedEntity = { type: "UNIVERSITY", data: university };
  } else if (depth === 2 && selFaculty) {
    const faculty = faculties.find((f) => String(f.id) === selFaculty);
    if (faculty) pickedEntity = { type: "FACULTY", data: faculty };
  } else if (depth === 3 && selProgram) {
    const program = studyPrograms.find((sp) => String(sp.id) === selProgram);
    if (program) pickedEntity = { type: "STUDY_PROGRAM", data: program };
  } else if (depth === 4 && selTrack) {
    const track = (selectedProgram?.tracks ?? []).find(
      (tr) => String(tr.id) === selTrack,
    );
    if (track) pickedEntity = { type: "TRACK", data: track };
  }

  let deeperLevels: ReactNode = null;
  if (depth >= 2) {
    deeperLevels = loadingDetail ? (
      <Spinner />
    ) : (
      <>
        <LevelSelect
          id="pickerFaculty"
          label={t("contribution.entityTypes.FACULTY")}
          value={selFaculty}
          disabled={!selUniversity || !detail}
          emptyMessage={t("contribution.picker.noChildren.FACULTY")}
          placeholder={t("contribution.picker.placeholder")}
          options={faculties.map((f) => ({ id: f.id, label: f.name }))}
          onChange={handleFacultyChange}
        />
        {depth >= 3 && (
          <LevelSelect
            id="pickerStudyProgram"
            label={t("contribution.entityTypes.STUDY_PROGRAM")}
            value={selProgram}
            disabled={!selFaculty}
            emptyMessage={t("contribution.picker.noChildren.STUDY_PROGRAM")}
            placeholder={t("contribution.picker.placeholder")}
            options={studyPrograms.map((sp) => ({
              id: sp.id,
              label: `${sp.name} - ${t(`universitiesPage.cycles.${sp.cycle}`)}`,
            }))}
            onChange={handleProgramChange}
          />
        )}
        {depth >= 4 && (
          <LevelSelect
            id="pickerLeaf"
            label={t("contribution.entityTypes.TRACK")}
            value={selTrack}
            disabled={!selProgram}
            emptyMessage={t("contribution.picker.noChildren.TRACK")}
            placeholder={t("contribution.picker.placeholder")}
            options={leafOptions.map((o) => ({ id: o.id, label: o.name }))}
            onChange={handleTrackChange}
          />
        )}
      </>
    );
  }

  return (
    <fieldset className="flex flex-col gap-3 border border-(--border-color) rounded-lg p-3">
      <legend className="text-xs font-semibold px-1 text-(--text-secondary)">
        {legend}
      </legend>
      {loadingList ? (
        <Spinner />
      ) : (
        <>
          <LevelSelect
            id="pickerUniversity"
            label={t("contribution.entityTypes.UNIVERSITY")}
            value={selUniversity}
            disabled={false}
            emptyMessage={t("universitiesPage.noResults")}
            placeholder={t("contribution.picker.placeholder")}
            options={universities.map((u) => ({
              id: u.id,
              label: u.acronym ? `${u.name} (${u.acronym})` : u.name,
            }))}
            onChange={(value) => void handleUniversityChange(value)}
          />
          {deeperLevels}
          {showSelectedDetails && pickedEntity && (
            <SelectedEntityDetails entity={pickedEntity} />
          )}
        </>
      )}
    </fieldset>
  );
}

export { EntityPicker };
