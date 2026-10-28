import type { ContributionFormDraft } from "../types";

// Form drafts for the optional children of a CREATE: three concrete levels,
// mirroring the tree schemas. Each node keeps a stable id so collapse state
// survives removals of its siblings.
interface TrackDraft {
  id: string;
  data: ContributionFormDraft;
}

interface StudyProgramDraft {
  id: string;
  data: ContributionFormDraft;
  tracks: TrackDraft[];
}

interface FacultyDraft {
  id: string;
  data: ContributionFormDraft;
  studyPrograms: StudyProgramDraft[];
}

function emptyTrack(): TrackDraft {
  return { id: crypto.randomUUID(), data: {} };
}

function emptyStudyProgram(): StudyProgramDraft {
  return { id: crypto.randomUUID(), data: {}, tracks: [] };
}

function emptyFaculty(): FacultyDraft {
  return { id: crypto.randomUUID(), data: {}, studyPrograms: [] };
}

function setDraftField(
  draft: ContributionFormDraft,
  field: keyof ContributionFormDraft,
  value: string | number | undefined,
): ContributionFormDraft {
  if (value === undefined) {
    return Object.fromEntries(
      Object.entries(draft).filter(([key]) => key !== field),
    );
  }
  return { ...draft, [field]: value };
}

function replaceAt<Item>(items: Item[], index: number, item: Item): Item[] {
  return items.map((existing, i) => (i === index ? item : existing));
}

function removeAt<Item>(items: Item[], index: number): Item[] {
  return items.filter((_, i) => i !== index);
}

// The submitted payloads: draft data as-is, children only when present,
// validated afterwards by the tree schemas.
function buildTrackPayload(track: TrackDraft) {
  return { ...track.data };
}

function buildStudyProgramPayload(program: StudyProgramDraft) {
  return {
    ...program.data,
    ...(program.tracks.length > 0 && {
      tracks: program.tracks.map(buildTrackPayload),
    }),
  };
}

function buildFacultyPayload(faculty: FacultyDraft) {
  return {
    ...faculty.data,
    ...(faculty.studyPrograms.length > 0 && {
      studyPrograms: faculty.studyPrograms.map(buildStudyProgramPayload),
    }),
  };
}

export {
  emptyFaculty,
  emptyStudyProgram,
  emptyTrack,
  setDraftField,
  replaceAt,
  removeAt,
  buildFacultyPayload,
  buildStudyProgramPayload,
  buildTrackPayload,
};
export type { FacultyDraft, StudyProgramDraft, TrackDraft };
