import { NavLink, useLocation } from "react-router";
import { Status } from "./Status";
import { use } from "react";
import { RootContext } from "../../contextData/RootContext";

import type { UserData } from "../../types/auth";
import type { SetIsMenuOpen } from "../../customHooks/useCloseMenu";

const baseClass = `block p-2 w-full text-center text-nowrap rounded-lg hover:bg-(--hover-surface) focus-visible:outline-none focus-visible:ring-2
  focus-visible:ring-(--focus-ring) focus-visible:bg-(--hover-surface)`;

const activeClass = "bg-(--hover-surface) text-(--accent-text) font-bold";

function menuItemClass({ isActive }: { isActive: boolean }) {
  return `${baseClass} ${isActive ? activeClass : ""}`;
}

const HOME_PATHS = ["/", "/search", "/browse"];

interface MobileMenuProps {
  setIsMenuOpen: SetIsMenuOpen;
  userData: UserData | null;
}

function MobileMenu({ setIsMenuOpen, userData }: MobileMenuProps) {
  const { t } = use(RootContext);
  const { pathname } = useLocation();
  const isHome = HOME_PATHS.includes(pathname);

  return (
    <div
      id="mobile-menu"
      className={`z-50 absolute top-full w-full left-0 text-(--text-primary) border border-(--border-color) shadow-(--card-shadow) bg-(--surface-2) backdrop-blur-sm`}
    >
      <ul className="flex flex-col items-center">
        <li className="w-full">
          <NavLink
            className={() => `${baseClass} ${isHome ? activeClass : ""}`}
            to="/search"
            onClick={() => {
              setIsMenuOpen(false);
            }}
          >
            {t("nav.home")}
          </NavLink>
        </li>
        <li className="w-full">
          <NavLink
            className={menuItemClass}
            to="/api-docs"
            onClick={() => {
              setIsMenuOpen(false);
            }}
          >
            {t("nav.apiDocs")}
          </NavLink>
        </li>
        <li className="w-full">
          <NavLink
            className={menuItemClass}
            to="/about"
            onClick={() => {
              setIsMenuOpen(false);
            }}
          >
            {t("nav.about")}
          </NavLink>
        </li>

        {userData && (
          <li className="w-full">
            <NavLink
              className={menuItemClass}
              to="/improve-data"
              onClick={() => {
                setIsMenuOpen(false);
              }}
            >
              {t("nav.improveData")}
            </NavLink>
          </li>
        )}
        {userData?.role === "ADMIN" && (
          <li className="w-full">
            <NavLink
              className={menuItemClass}
              to="/admin-dashboard"
              onClick={() => {
                setIsMenuOpen(false);
              }}
            >
              {t("nav.admin")}
            </NavLink>
          </li>
        )}
        <li className={`flex justify-center items-center`}>
          <Status setIsMenuOpen={setIsMenuOpen} />
        </li>
      </ul>
    </div>
  );
}

export { MobileMenu };
