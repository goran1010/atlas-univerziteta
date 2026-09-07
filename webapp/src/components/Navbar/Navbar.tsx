import { use } from "react";
import { RootContext } from "../../contextData/RootContext";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { MobileMenu } from "./MobileMenu";
import { StandardMenu } from "./StandardMenu";
import { LanguageSwitcher } from "./LanguageSwitcher";

import { type UseCloseMenu } from "../../customHooks/useCloseMenu";

function Navbar({ closeMenu }: { closeMenu: UseCloseMenu }) {
  const { navRef, isMenuOpen, setIsMenuOpen } = closeMenu;
  const { userData, language, setLanguage, t } = use(RootContext);

  return (
    <nav
      ref={navRef}
      onClick={() => {
        setIsMenuOpen(false);
      }}
      className="z-40 w-full px-1 sm:px-2 py-2 font-bold flex md:justify-between items-center gap-1 sm:gap-2 md:gap-3 transition transform text-(--text-primary)
      border-b border-(--border-color) backdrop-blur sticky top-0 left-0 shadow-md"
    >
      <div className="flex md:hidden items-center">
        <button
          id="mobile-menu-toggle"
          type="button"
          aria-label={t("nav.toggleMenuAria")}
          aria-controls="mobile-menu"
          aria-expanded={isMenuOpen}
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen((prev) => !prev);
          }}
          className="relative inline-flex items-center justify-center rounded-md p-2 transition-transform hover:cursor-pointer text-(--text-primary) border border-(--border-color) shadow-(--card-shadow-soft) hover:bg-(--hover-surface) hover:shadow-(--card-shadow) active:scale-[0.98]"
        >
          <span className="flex flex-col justify-center items-center w-5 h-5 gap-1.5">
            <span
              className={`block h-0.5 w-5 bg-current rounded-full transition-transform duration-200 origin-center ${isMenuOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-current rounded-full transition-opacity duration-200 ${isMenuOpen ? "opacity-0 scale-x-0" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-current rounded-full transition-transform duration-200 origin-center ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </span>
        </button>
      </div>
      {isMenuOpen && (
        <MobileMenu setIsMenuOpen={setIsMenuOpen} userData={userData} />
      )}

      <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-center md:justify-between">
        <ThemeSwitcher />
        <StandardMenu setIsMenuOpen={setIsMenuOpen} userData={userData} />
        <LanguageSwitcher setLanguage={setLanguage} language={language} />
      </div>
    </nav>
  );
}

export { Navbar };
