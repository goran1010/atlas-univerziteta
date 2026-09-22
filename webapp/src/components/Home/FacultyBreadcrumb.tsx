import { Link } from "react-router";
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
      <Link
        to={`/faculties/${faculty.id.toString()}`}
        className="underline underline-offset-3 decoration-1 hover:decoration-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        {faculty.name}
      </Link>
      {" - "}
      <Link
        to={`/universities/${faculty.universityId.toString()}`}
        className="underline underline-offset-3 decoration-1 hover:decoration-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        {faculty.university.name}
      </Link>
      {faculty.university.acronym && ` (${faculty.university.acronym})`}
    </p>
  );
}

export { FacultyBreadcrumb };
