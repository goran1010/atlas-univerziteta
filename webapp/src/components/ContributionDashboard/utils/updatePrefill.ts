import { fetchPublic } from "../../../utils/fetchPublic";
import {
  universityDetailResponseSchema,
  facultyDetailResponseSchema,
  studyProgramDetailResponseSchema,
  trackDetailResponseSchema,
} from "../../../schemas/university";

import type {
  UniversityDetail,
  FacultyDetail,
  StudyProgramDetail,
  TrackDetail,
} from "../../../schemas/university";
import type { TargetType } from "../../../schemas/domain";
import type { RequestContext } from "../../../types";
import type { ContributionFormDraft } from "../types";

function universityDraft(university: UniversityDetail): ContributionFormDraft {
  return {
    name: university.name,
    city: university.city,
    country: university.country,
    entity: university.entity,
    ownership: university.ownership,
    acronym: university.acronym,
    foundedYear: university.foundedYear,
    website: university.website,
    address: university.address,
    phone: university.phone,
    email: university.email,
  };
}

function facultyDraft(faculty: FacultyDetail): ContributionFormDraft {
  return {
    name: faculty.name,
    city: faculty.city,
    website: faculty.website,
    address: faculty.address,
    phone: faculty.phone,
    email: faculty.email,
  };
}

function studyProgramDraft(program: StudyProgramDetail): ContributionFormDraft {
  return {
    name: program.name,
    cycle: program.cycle,
    durationYears: program.durationYears,
    ects: program.ects,
    language: program.language,
  };
}

function trackDraft(track: TrackDetail): ContributionFormDraft {
  return {
    name: track.name,
    ects: track.ects,
    durationYears: track.durationYears,
  };
}

// Fetches the update target's current values so the form can prefill and
// later submit only the fields that actually changed.
async function fetchTargetDraft(
  targetType: TargetType,
  id: string,
  ctx: RequestContext,
): Promise<ContributionFormDraft | null> {
  switch (targetType) {
    case "UNIVERSITY": {
      const result = await fetchPublic(
        {
          path: `/api/v1/universities/${id}`,
          responseSchema: universityDetailResponseSchema,
          errorMessageKey: "messages.universities.detailsError",
          logLabel: "load update target",
        },
        ctx,
      );
      return result && universityDraft(result.data);
    }
    case "FACULTY": {
      const result = await fetchPublic(
        {
          path: `/api/v1/faculties/${id}`,
          responseSchema: facultyDetailResponseSchema,
          errorMessageKey: "messages.universities.detailsError",
          logLabel: "load update target",
        },
        ctx,
      );
      return result && facultyDraft(result.data);
    }
    case "STUDY_PROGRAM": {
      const result = await fetchPublic(
        {
          path: `/api/v1/study-programs/${id}`,
          responseSchema: studyProgramDetailResponseSchema,
          errorMessageKey: "messages.universities.detailsError",
          logLabel: "load update target",
        },
        ctx,
      );
      return result && studyProgramDraft(result.data);
    }
    case "TRACK": {
      const result = await fetchPublic(
        {
          path: `/api/v1/tracks/${id}`,
          responseSchema: trackDetailResponseSchema,
          errorMessageKey: "messages.universities.detailsError",
          logLabel: "load update target",
        },
        ctx,
      );
      return result && trackDraft(result.data);
    }
  }
}

export { fetchTargetDraft };
