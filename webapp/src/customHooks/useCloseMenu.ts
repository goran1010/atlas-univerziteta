import { useEffect } from "react";
import { useRef, useState } from "react";
import type { Dispatch, SetStateAction, RefObject } from "react";

export type SetIsMenuOpen = Dispatch<SetStateAction<boolean>>;

export interface UseCloseMenu {
  navRef: RefObject<HTMLElement | null>;
  isMenuOpen: boolean;
  setIsMenuOpen: SetIsMenuOpen;
  isThemeMenuOpen: boolean;
  setIsThemeMenuOpen: SetIsMenuOpen;
  isLanguageMenuOpen: boolean;
  setIsLanguageMenuOpen: SetIsMenuOpen;
}

function useCloseMenu(): UseCloseMenu {
  const navRef = useRef<HTMLElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen && !isThemeMenuOpen && !isLanguageMenuOpen) return;

    const handleClickAway = () => {
      setIsMenuOpen(false);
      setIsThemeMenuOpen(false);
      setIsLanguageMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsThemeMenuOpen(false);
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickAway);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleClickAway);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen, isThemeMenuOpen, isLanguageMenuOpen]);

  return {
    navRef,
    isMenuOpen,
    setIsMenuOpen,
    isThemeMenuOpen,
    setIsThemeMenuOpen,
    isLanguageMenuOpen,
    setIsLanguageMenuOpen,
  };
}

export { useCloseMenu };
