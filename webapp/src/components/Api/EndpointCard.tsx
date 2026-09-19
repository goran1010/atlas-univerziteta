import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import type { Endpoint } from "./utils/endpoints";

const methodColor = {
  GET: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  POST: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  PUT: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  PATCH:
    "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  DELETE: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
};

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const { t } = use(RootContext);

  return (
    <article className="border border-(--border-color) rounded-lg p-5 flex flex-col gap-4 bg-(--surface-2)/70">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 font-mono text-xs font-bold ${
            methodColor[endpoint.method] ||
            "bg-(--surface-alt) text-(--text-primary)"
          }`}
        >
          {endpoint.method}
        </span>
        <code className="font-mono text-sm break-all">{endpoint.path}</code>
      </div>
      <p className="text-sm text-(--text-secondary)">
        {t(endpoint.descriptionKey)}
      </p>

      {endpoint.params && (
        <div className="rounded-md border border-(--border-color) p-3 overflow-x-auto">
          <p className="text-sm font-semibold mb-1">
            {t("endpoint.queryParameters")}
          </p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-(--border-color)">
                <th className="pb-1 pr-4">{t("endpoint.name")}</th>
                <th className="pb-1 pr-4">{t("endpoint.required")}</th>
                <th className="pb-1">{t("endpoint.description")}</th>
              </tr>
            </thead>
            <tbody>
              {endpoint.params.map((p) => (
                <tr key={p.name}>
                  <td className="pt-1 pr-4 font-mono">{p.name}</td>
                  <td className="pt-1 pr-4">
                    {p.required ? t("endpoint.yes") : t("endpoint.no")}
                  </td>
                  <td className="pt-1">{t(p.descriptionKey ?? "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {endpoint.requestExample && (
        <div>
          <p className="text-sm font-semibold mb-1">
            {t("endpoint.requestBody")}
          </p>
          <pre className="bg-(--surface-alt) rounded p-3 text-xs overflow-x-auto border border-(--border-color)">
            {endpoint.requestExample}
          </pre>
        </div>
      )}

      {endpoint.successExample && (
        <div>
          <p className="text-sm font-semibold mb-1">
            {t("endpoint.successResponse")}
          </p>
          <pre className="bg-(--surface-alt) rounded p-3 text-xs overflow-x-auto border border-(--border-color)">
            {endpoint.successExample}
          </pre>
        </div>
      )}

      {endpoint.errorExample && (
        <div>
          <p className="text-sm font-semibold mb-1">
            {t("endpoint.errorResponses")}
          </p>
          <pre className="bg-(--surface-alt) rounded p-3 text-xs overflow-x-auto border border-(--border-color)">
            {endpoint.errorExample}
          </pre>
        </div>
      )}
    </article>
  );
}

export { EndpointCard };
