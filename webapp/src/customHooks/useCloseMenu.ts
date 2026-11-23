import { useEffect } from "react";
import { useRef, useState } from "react";
import type { Dispatch, SetStateAction, RefObject } from "react";

export type SetIsMenuOpen = Dispatch<SetStateAction<boolean>>;

export interface UseCloseMenu {
  navRef: RefObject<HTMLElement | null>;
  isMenuOpen: boolean;
  setIsMenuOpen: SetIsMenuOpen;
}

function useCloseMenu(): UseCloseMenu {
  const navRef = useRef<HTMLElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickAway = () => {
      setIsMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickAway);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleClickAway);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return { navRef, isMenuOpen, setIsMenuOpen };
}

export { useCloseMenu };
