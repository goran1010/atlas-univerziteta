import { useEffect, useRef, useState, use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { Spinner } from "../../utils/Spinner";
import { UniversityCard } from "./UniversityCard";
import { SERVER_URL } from "../../utils/envConfig";
import { readErrorMessage } from "../../schemas/api";
import { universityListResponseSchema } from "../../schemas/university";
import type { UniversityListItem } from "../../schemas/university";

function GetAllUniversities() {
  const { t, addNotification } = use(RootContext);
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
        setLoading(false);
      }
    }
    void fetchUniversities();
  }, [addNotification]);

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

  return (
    <ul className="flex flex-col gap-3 w-full">
      {universities.map((u) => (
        <UniversityCard key={u.id} university={u} />
      ))}
    </ul>
  );
}

export { GetAllUniversities };
