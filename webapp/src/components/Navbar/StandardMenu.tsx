import { NavLink, useLocation } from "react-router";
import { Status } from "./Status";
import { use } from "react";
import { RootContext } from "../../contextData/RootContext";

import type { SetIsMenuOpen } from "../../customHooks/useCloseMenu";
import type { UserData } from "../../types/auth";

interface StandardMenuProps {
  setIsMenuOpen: SetIsMenuOpen;
  userData: UserData;
}

const baseClass =
  "block h-full px-1 py-2 flex items-center justify-center text-center rounded-lg transition-colors duration-150 hover:bg-(--hover-surface) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) focus-visible:bg-(--hover-surface)";

const activeClass = "bg-(--hover-surface) text-(--accent-text)";

function menuLinkClass({ isActive }: { isActive: boolean }) {
  return `${baseClass} ${isActive ? activeClass : ""}`;
}

const HOME_PATHS = ["/", "/search", "/browse"];

function StandardMenu({ setIsMenuOpen, userData }: StandardMenuProps) {
  const { t } = use(RootContext);
  const { pathname } = useLocation();
  const isHome = HOME_PATHS.includes(pathname);

  return (
    <div className="hidden md:flex justify-between">
      <ul className="flex h-full gap-1">
        <li>
          <NavLink
            className={() => `${baseClass} ${isHome ? activeClass : ""}`}
            to="/search"
          >
            {t("nav.home")}
          </NavLink>
        </li>

        <li>
          <NavLink className={menuLinkClass} to="/about">
            {t("nav.about")}
          </NavLink>
        </li>

        <li>
          <NavLink className={menuLinkClass} to="/api-docs">
            {t("nav.apiDocs")}
          </NavLink>
        </li>

        {userData && (
          <li>
            <NavLink className={menuLinkClass} to="/improve-data">
              {t("nav.improveData")}
            </NavLink>
          </li>
        )}
        {userData?.role === "ADMIN" && (
          <li>
            <NavLink className={menuLinkClass} to="/admin-dashboard">
              {t("nav.admin")}
            </NavLink>
          </li>
        )}
        <li className="flex justify-center items-center">
          <Status setIsMenuOpen={setIsMenuOpen} />
        </li>
      </ul>
    </div>
  );
}

export { StandardMenu };
