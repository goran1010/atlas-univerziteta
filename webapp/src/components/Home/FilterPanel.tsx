import { useState, type ReactNode } from "react";
import { ChevronDownIcon } from "../sharedComponents/icons";

import type { Entity, Ownership, StudyCycle } from "../../schemas/domain";

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <fieldset className="flex flex-col gap-1 items-center sm:items-start">
      <button
        type="button"
        onClick={() => {
          setOpen((prev) => !prev);
        }}
        className="flex items-center gap-1.5 text-xs font-semibold text-(--text-muted) cursor-pointer"
      >
        <ChevronDownIcon
          className={`text-[10px] transition-transform ${open ? "" : "-rotate-90"}`}
        />
        {label}
      </button>
      {open && (
        <div className="flex flex-col gap-0.5 pl-4 self-start">{children}</div>
      )}
    </fieldset>
  );
}

function RadioOption({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-(--text-primary) cursor-pointer py-0.5 hover:text-(--accent-text) transition-colors">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onClick={() => {
          if (checked) onChange("");
        }}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        className="accent-(--accent)"
      />
      {label}
    </label>
  );
}

function CheckboxOption({
  value,
  label,
  checked,
  onChange,
}: {
  value: string;
  label: string;
  checked: boolean;
  onChange: (value: string, checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-(--text-primary) cursor-pointer py-0.5 hover:text-(--accent-text) transition-colors">
      <input
        type="checkbox"
        value={value}
        checked={checked}
        onChange={(e) => {
          onChange(value, e.target.checked);
        }}
        className="accent-(--accent)"
      />
      {label}
    </label>
  );
}

const ENTITIES: Entity[] = ["FBIH", "RS", "BD"];
const OWNERSHIPS: Ownership[] = ["PUBLIC", "PRIVATE"];
const CYCLES: StudyCycle[] = [
  "FIRST",
  "SECOND",
  "THIRD",
  "INTEGRATED",
  "VOCATIONAL",
  "SPECIALIST",
];

function FilterPanel({
  entityFilter,
  ownershipFilter,
  cycleFilters,
  filtersOpen,
  onToggleFilters,
  onFilterChange,
  onCycleChange,
  t,
}: {
  entityFilter: Entity | "";
  ownershipFilter: Ownership | "";
  cycleFilters: StudyCycle[];
  filtersOpen: boolean;
  onToggleFilters: () => void;
  onFilterChange: (key: "entity" | "ownership", value: string | null) => void;
  onCycleChange: (value: string, checked: boolean) => void;
  t: (key: string) => string;
}) {
  const activeCount = [entityFilter, ownershipFilter, ...cycleFilters].filter(
    Boolean,
  ).length;

  return (
    <div className="w-full max-w-lg border border-(--border-color) rounded-lg">
      <button
        type="button"
        onClick={onToggleFilters}
        className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-semibold text-(--text-primary) cursor-pointer"
      >
        <span className="flex items-center gap-2">
          {t("universitiesPage.filters")}
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-(--hover-surface) text-(--accent-text)">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDownIcon
          className={`text-xs text-(--text-muted) transition-transform ${filtersOpen ? "" : "-rotate-90"}`}
        />
      </button>
      {filtersOpen && (
        <div className="px-4 pb-3 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-(--border-color) pt-3">
          <FilterSection label={t("universitiesPage.filterEntity")}>
            {ENTITIES.map((e) => (
              <RadioOption
                key={e}
                name="entity"
                value={e}
                label={t(`universitiesPage.entities.${e}`)}
                checked={entityFilter === e}
                onChange={(v) => {
                  onFilterChange("entity", v || null);
                }}
              />
            ))}
          </FilterSection>
          <FilterSection label={t("universitiesPage.filterOwnership")}>
            {OWNERSHIPS.map((o) => (
              <RadioOption
                key={o}
                name="ownership"
                value={o}
                label={t(`universitiesPage.ownership.${o}`)}
                checked={ownershipFilter === o}
                onChange={(v) => {
                  onFilterChange("ownership", v || null);
                }}
              />
            ))}
          </FilterSection>
          <FilterSection label={t("universitiesPage.filterCycle")}>
            {CYCLES.map((c) => (
              <CheckboxOption
                key={c}
                value={c}
                label={t(`universitiesPage.cycles.${c}`)}
                checked={cycleFilters.includes(c)}
                onChange={onCycleChange}
              />
            ))}
          </FilterSection>
        </div>
      )}
    </div>
  );
}

export { FilterPanel };
