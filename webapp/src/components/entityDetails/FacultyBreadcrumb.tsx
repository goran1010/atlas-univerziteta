import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { TextLink } from "../sharedComponents/TextLink";
import { BuildingIcon } from "../sharedComponents/icons";

import type { Country } from "../../schemas/domain";

function FacultyBreadcrumb({
  faculty,
}: {
  faculty: {
    id: number;
    name: string;
    universityId: number;
    university: {
      name: string;
      acronym?: string | null | undefined;
      country?: Country | undefined;
    };
  };
}) {
  const { t } = use(RootContext);
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
      {faculty.university.country &&
        `, ${t(`universitiesPage.countries.${faculty.university.country}`)}`}
    </p>
  );
}

export { FacultyBreadcrumb };
