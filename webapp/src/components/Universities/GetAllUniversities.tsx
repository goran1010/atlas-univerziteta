import { useEffect, useRef, useState, use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { Spinner } from "../../utils/Spinner";
import { UniversityCard } from "./UniversityCard";
import { ResultGroup } from "./ResultGroup";
import { groupBy } from "./utils/groupBy";
import { SERVER_URL } from "../../utils/envConfig";
import { readErrorMessage } from "../../schemas/api";
import { guardedFetch } from "../../utils/guardedFetch";
import { isServerNotReadyError } from "../../utils/serverStatus";
import { universityListResponseSchema } from "../../schemas/university";
import type { UniversityListItem } from "../../schemas/university";

function GetAllUniversities() {
  const { t, addNotification, serverStatus } = use(RootContext);
  const [universities, setUniversities] = useState<UniversityListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });

  useEffect(() => {
    async function fetchUniversities() {
      try {
        setLoading(true);
        const res = await guardedFetch(
          `${SERVER_URL}/api/v1/universities`,
          { method: "GET", mode: "cors" },
          { serverStatus },
        );

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
      } catch (error) {
        if (isServerNotReadyError(error)) {
          return;
        }
        addNotification({
          type: "error",
          message: tRef.current("messages.universities.loadError"),
        });
      } finally {
        setLoading(false);
      }
    }
    void fetchUniversities();
  }, [addNotification, serverStatus]);

  if (loading) return <Spinner />;

  if (!universities.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-(--text-muted)">
        <span className="text-4xl" aria-hidden="true">
          🔍
        </span>
        <p>{t("universitiesPage.noResults")}</p>
      </div>
    );
  }

  const groups = groupBy(universities, (u) =>
    t(`universitiesPage.ownershipGroup.${u.ownership}`),
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      {groups.map((group) => (
        <ResultGroup key={group.key} label={group.key} collapsible count={group.items.length}>
          {group.items.map((u) => (
            <UniversityCard key={u.id} university={u} />
          ))}
        </ResultGroup>
      ))}
    </div>
  );
}

export { GetAllUniversities };
