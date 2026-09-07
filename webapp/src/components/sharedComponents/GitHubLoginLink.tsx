import { Spinner } from "../../utils/Spinner";
import { use, useState } from "react";
import { RootContext } from "../../contextData/RootContext";
import type { MouseEvent } from "react";
import { SERVER_URL } from "../../utils/envConfig";
import { GitHubIcon } from "./icons";
import { SERVER_STATUS } from "../../utils/serverStatus";

interface GitHubLoginLinkProps {
  disabled: boolean;
  onLoadingChange: (loading: boolean) => void;
}

function GitHubLoginLink({ disabled, onLoadingChange }: GitHubLoginLinkProps) {
  const { t, serverStatus } = use(RootContext);
  const [loading, setLoading] = useState(false);
  const isDisabled = disabled || loading || serverStatus !== SERVER_STATUS.LIVE;

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    setLoading(true);
    onLoadingChange(true);
  }
  const baseClassName = `w-full relative inline-flex items-center justify-center rounded-md p-2 text-sm font-semibold tracking-[0.01em] transition-all duration-150 bg-green-700 text-green-50 ${isDisabled ? "cursor-not-allowed opacity-45" : "cursor-pointer hover:bg-green-800 hover:shadow-[0_10px_20px_rgba(21,128,61,0.25)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"}`;
  return (
    <a
      href={`${SERVER_URL}/auth/github`}
      onClick={handleClick}
      aria-disabled={isDisabled}
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
