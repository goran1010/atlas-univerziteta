import { use } from "react";
import { Link } from "react-router";
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
      aria-label={t("nav.main")}
      onClick={() => {
        setIsMenuOpen(false);
      }}
      className="z-40 w-full px-1 sm:px-2 py-2 font-bold flex items-center gap-1 sm:gap-2 lg:gap-3 transition transform text-(--text-primary)
      border-b border-(--border-color) backdrop-blur sticky top-0 left-0 shadow-md"
    >
      <div className="flex lg:hidden items-center">
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

      <Link
        to="/"
        aria-label={t("title.app")}
        className="flex shrink-0 items-center gap-2 rounded-lg px-1 py-1 lg:text-lg hover:text-(--accent-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
      >
        <img
          src="/images/favicons/favicon.svg"
          alt=""
          className="h-7 w-7"
          width={28}
          height={28}
        />
        <span className="hidden min-[360px]:inline lg:hidden xl:inline">
          {t("title.app")}
        </span>
      </Link>

      <StandardMenu setIsMenuOpen={setIsMenuOpen} userData={userData} />

      <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
        <div className="hidden sm:flex">
          <ThemeSwitcher />
        </div>
        <LanguageSwitcher setLanguage={setLanguage} language={language} />
      </div>
    </nav>
  );
}

export { Navbar };
