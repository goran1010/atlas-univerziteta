import { Spinner } from "../../utils/Spinner";
import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import type { MouseEvent } from "react";
import { SERVER_URL } from "../../utils/envConfig";
import { GitHubIcon } from "./icons";

interface GitHubLoginLinkProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

function GitHubLoginLink({ loading, setLoading }: GitHubLoginLinkProps) {
  const { t } = use(RootContext);

  function handleLoading(e: MouseEvent<HTMLAnchorElement>) {
    if (loading) {
      e.preventDefault();
      return;
    }
    setLoading(true);
  }
  const baseClassName = `w-full relative inline-flex items-center justify-center rounded-md p-2 text-sm font-semibold tracking-[0.01em] transition-all duration-150 bg-(--accent) text-slate-50 ${loading ? "cursor-not-allowed bg-(--accent-disabled) text-(--disabled-text)" : "cursor-pointer hover:bg-(--accent-hover) hover:shadow-[0_10px_20px_rgba(37,99,235,0.25)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"}`;
  return (
    <a
      href={`${SERVER_URL}/auth/github`}
      onClick={handleLoading}
      aria-disabled={loading}
      className={baseClassName}
    >
      <div
        className={`h-full w-full flex justify-center items-center absolute`}
      >
        {loading && <Spinner />}
      </div>
      <span className={`flex gap-1 ${loading ? "invisible" : "visible"}`}>
        <GitHubIcon size={20} />
        {t("auth.continueWithGithub")}
      </span>
    </a>
  );
}

export { GitHubLoginLink };
