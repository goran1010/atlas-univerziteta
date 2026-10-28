import { useCallback, useEffect, useState } from "react";
import { fetchPublicResponse } from "../utils/fetchPublic";

import type { z } from "zod";

type DetailState<Data> =
  | { kind: "loading" }
  | { kind: "loaded"; data: Data }
  | { kind: "notFound" }
  | { kind: "error" };

// Loads one entity's detail with a tri-state outcome, so pages can tell a
// missing entity from a failed request and offer a retry. The fetch aborts
// when the path changes mid-flight, so a fast id switch cannot leave a
// previous entity's response rendered.
function useEntityDetail<Schema extends z.ZodType>(
  path: string,
  responseSchema: Schema,
  logLabel: string,
) {
  const [state, setState] = useState<DetailState<z.output<Schema>>>({
    kind: "loading",
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const outcome = await fetchPublicResponse(
          path,
          responseSchema,
          controller.signal,
        );
        if (controller.signal.aborted) return;

        if (outcome.ok) {
          setState({ kind: "loaded", data: outcome.result });
          return;
        }
        if (outcome.status === 404) {
          setState({ kind: "notFound" });
          return;
        }
        console.warn(`Failed to ${logLabel}:`, outcome.error?.message);
        setState({ kind: "error" });
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(`Error trying to ${logLabel}:`, error);
        setState({ kind: "error" });
      }
    }

    // eslint-disable-next-line react-x/set-state-in-effect, react-hooks/set-state-in-effect -- reset to loading when the path or attempt changes
    setState({ kind: "loading" });
    void load();

    return () => {
      controller.abort();
    };
  }, [path, responseSchema, logLabel, attempt]);

  const retry = useCallback(() => {
    setAttempt((prev) => prev + 1);
  }, []);

  return { state, retry };
}

export { useEntityDetail };
export type { DetailState };
