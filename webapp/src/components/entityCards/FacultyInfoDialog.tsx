import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { BookOpenIcon } from "../sharedComponents/icons";
import { LinkButton } from "../sharedComponents/LinkButton";
import { Dialog } from "../sharedComponents/Dialog";
import { Button } from "../sharedComponents/Button";
import { Spinner } from "../sharedComponents/Spinner";
import { ShareButton } from "../entityDetails/ShareButton";
import { FacultySummary } from "../entityDetails/FacultySummary";
import { DetailPageStatus } from "../entityDetails/DetailPageStatus";
import { useEntityDetail } from "../../customHooks/useEntityDetail";
import { facultyDetailResponseSchema } from "../../schemas/university";

// loads the same detail as the faculty page, so the dialog shows what the
// page does whichever listing the faculty was opened from
function FacultyInfo({ id, onClose }: { id: number; onClose: () => void }) {
  const { t, tCount } = use(RootContext);
  const { state, retry } = useEntityDetail(
    `/api/v1/faculties/${id.toString()}`,
    facultyDetailResponseSchema,
    "load faculty info",
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

  const faculty = state.data.data;

  return (
    <div className="flex flex-col gap-3">
      <FacultySummary faculty={faculty} />
      <p className="text-sm text-(--text-muted)">
        <BookOpenIcon />{" "}
        <span className="font-bold text-violet-600 dark:text-violet-400">
          {faculty.studyPrograms.length}
        </span>{" "}
        {tCount(
          "universitiesPage.studyProgramCount",
          faculty.studyPrograms.length,
        )}
      </p>
      <div className="flex justify-center">
        <LinkButton
          to={`/faculties/${id.toString()}`}
          className="text-sm w-full sm:w-auto"
          onClick={onClose}
        >
          {t("universitiesPage.openFullPage")}
        </LinkButton>
      </div>
    </div>
  );
}

function FacultyInfoDialog({
  faculty,
  open,
  onClose,
}: {
  faculty: { id: number; name: string };
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={faculty.name}
      headerActions={
        <ShareButton url={`/faculties/${faculty.id.toString()}`} />
      }
    >
      <FacultyInfo id={faculty.id} onClose={onClose} />
    </Dialog>
  );
}

export { FacultyInfoDialog };
