import { TextLink } from "../sharedComponents/TextLink";
import { BuildingIcon } from "../sharedComponents/icons";

function FacultyBreadcrumb({
  faculty,
}: {
  faculty: {
    id: number;
    name: string;
    universityId: number;
    university: { name: string; acronym?: string | null };
  };
}) {
  return (
    <p className="text-sm text-(--text-muted) mt-1">
      <BuildingIcon />{" "}
      <TextLink to={`/faculties/${faculty.id.toString()}`}>
        {faculty.name}
      </TextLink>
      {" - "}
      <TextLink to={`/universities/${faculty.universityId.toString()}`}>
        {faculty.university.name}
      </TextLink>
      {faculty.university.acronym && ` (${faculty.university.acronym})`}
    </p>
  );
}

export { FacultyBreadcrumb };
