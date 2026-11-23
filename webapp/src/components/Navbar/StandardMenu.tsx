import { NavLink } from "react-router";
import {
  CodeIcon,
  HomeIcon,
  InfoIcon,
  PencilIcon,
  ShieldCheckIcon,
} from "../sharedComponents/icons";
import { Status } from "./Status";
import { use } from "react";
import { RootContext } from "../../contextData/RootContext";

import type { SetIsMenuOpen } from "../../customHooks/useCloseMenu";
import type { UserData } from "../../types";

interface StandardMenuProps {
  setIsMenuOpen: SetIsMenuOpen;
  userData: UserData;
}

const baseClass =
  "block h-full px-1.5 py-2 flex items-center justify-center gap-1.5 text-center rounded-lg transition-colors duration-150 hover:bg-(--hover-surface) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring) focus-visible:bg-(--hover-surface)";

const activeClass = "bg-(--hover-surface) text-(--accent-text)";

function menuLinkClass({ isActive }: { isActive: boolean }) {
  return `${baseClass} ${isActive ? activeClass : ""}`;
}

function StandardMenu({ setIsMenuOpen, userData }: StandardMenuProps) {
  const { t } = use(RootContext);

  return (
    <div className="hidden lg:flex">
      <ul className="flex h-full gap-1">
        <li>
          <NavLink className={menuLinkClass} to="/" end>
            <HomeIcon className="shrink-0" /> {t("nav.home")}
          </NavLink>
        </li>

        <li>
          <NavLink className={menuLinkClass} to="/about">
            <InfoIcon className="shrink-0" /> {t("nav.about")}
          </NavLink>
        </li>

        <li>
          <NavLink className={menuLinkClass} to="/api-docs">
            <CodeIcon className="shrink-0" /> {t("nav.apiDocs")}
          </NavLink>
        </li>

        {userData && (
          <li>
            <NavLink className={menuLinkClass} to="/improve-data">
              <PencilIcon className="shrink-0" /> {t("nav.improveData")}
            </NavLink>
          </li>
        )}
        {userData?.role === "ADMIN" && (
          <li>
            <NavLink className={menuLinkClass} to="/admin-dashboard">
              <ShieldCheckIcon className="shrink-0" /> {t("nav.admin")}
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
