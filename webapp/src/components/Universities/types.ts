import type {
  UniversityDetail,
  UniversityDetailFaculty,
  UniversityDetailStudyProgram,
} from "../../schemas/university";

interface EntityAncestors {
  university: UniversityDetail;
  faculty?: UniversityDetailFaculty;
  studyProgram?: UniversityDetailStudyProgram;
}

export type { EntityAncestors };
