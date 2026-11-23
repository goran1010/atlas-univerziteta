import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { BuildingIcon } from "../sharedComponents/icons";
import { LinkButton } from "../sharedComponents/LinkButton";
import { Dialog } from "../sharedComponents/Dialog";
import { Button } from "../sharedComponents/Button";
import { Spinner } from "../sharedComponents/Spinner";
import { ShareButton } from "../entityDetails/ShareButton";
import { UniversitySummary } from "../entityDetails/UniversitySummary";
import { DetailPageStatus } from "../entityDetails/DetailPageStatus";
import { useEntityDetail } from "../../customHooks/useEntityDetail";
import { universityDetailResponseSchema } from "../../schemas/university";

import type { UniversityListItem } from "../../schemas/university";

// loads the same detail as the university page, since a browse listing
// carries only part of the fields the page shows
function UniversityInfo({ id, onClose }: { id: number; onClose: () => void }) {
  const { t, tCount } = use(RootContext);
  const { state, retry } = useEntityDetail(
    `/api/v1/universities/${id.toString()}`,
    universityDetailResponseSchema,
    "load university info",
  );

  if (state.kind === "loading") return <Spinner />;

  if (state.kind === "invalidResponse") {
    return (
      <DetailPageStatus message={t("messages.apiError.invalidResponse")} />
    );
  }

  if (state.kind === "error") {
    return (
      <DetailPageStatus
        message={t("universitiesPage.detailError")}
        action={
          <Button variant="secondary" className="mt-3" onClick={retry}>
            {t("universitiesPage.retry")}
          </Button>
        }
      />
    );
  }

  if (state.kind === "notFound") {
    return <DetailPageStatus message={t("universitiesPage.noResults")} />;
  }

  const university = state.data.data;

  return (
    <div className="flex flex-col gap-3">
      <UniversitySummary university={university} />
      <p className="text-sm text-(--text-muted)">
        <BuildingIcon />{" "}
        <span className="font-bold text-teal-600 dark:text-teal-400">
          {university.faculties.length}
        </span>{" "}
        {tCount("universitiesPage.facultyCount", university.faculties.length)}
      </p>
      <div className="flex justify-center">
        <LinkButton
          to={`/universities/${id.toString()}`}
          className="text-sm w-full sm:w-auto"
          onClick={onClose}
        >
          {t("universitiesPage.openFullPage")}
        </LinkButton>
      </div>
    </div>
  );
}

function UniversityInfoDialog({
  university,
  open,
  onClose,
}: {
  university: UniversityListItem;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        university.acronym
          ? `${university.name} (${university.acronym})`
          : university.name
      }
      headerActions={
        <ShareButton url={`/universities/${university.id.toString()}`} />
      }
    >
      <UniversityInfo id={university.id} onClose={onClose} />
    </Dialog>
  );
}

export { UniversityInfoDialog };
