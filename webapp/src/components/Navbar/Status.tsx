import { use } from "react";
import { LogInIcon, UserIcon } from "../sharedComponents/icons";
import { NavLink } from "react-router";
import { RootContext } from "../../contextData/RootContext";

const baseClass =
  "block h-full flex px-1.5 py-2 items-center justify-center gap-1.5 cursor-pointer rounded-lg transition-colors duration-150 hover:bg-(--hover-surface) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) focus-visible:bg-(--hover-surface)";

const activeClass = "bg-(--hover-surface) text-(--accent-text)";

function statusLinkClass({ isActive }: { isActive: boolean }) {
  return `${baseClass} ${isActive ? activeClass : ""}`;
}

function Status({
  setIsMenuOpen,
}: {
  setIsMenuOpen: (value: boolean) => void;
}) {
  const { userData, t } = use(RootContext);

  if (userData) {
    return (
      <NavLink
        className={statusLinkClass}
        to="/profile"
        onClick={() => {
          setIsMenuOpen(false);
        }}
      >
        <UserIcon className="shrink-0" /> {t("nav.profile")}
      </NavLink>
    );
  }

  return (
    <NavLink
      className={statusLinkClass}
      to="/login"
      onClick={() => {
        setIsMenuOpen(false);
      }}
    >
      <LogInIcon className="shrink-0" /> {t("nav.login")}
    </NavLink>
  );
}

export { Status };
