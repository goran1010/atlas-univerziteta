import { foldSearchText, foldSearchTextOrNull } from "./fold.js";

// The single statement of which fields feed search for each model: pass the
// source fields and get the folded column values back. Absent (undefined)
// fields produce no keys, so partial updates stay partial; null clears the
// folded copy alongside its source field.

// Query words never contain whitespace, so a stored city without it still
// contains every word of "Banja Luka" and also matches the one-word spelling
// "Banjaluka".
function foldCity(city: string): string {
  return foldSearchText(city).replace(/\s+/g, "");
}

function universitySearchFields(fields: {
  name?: string | undefined;
  city?: string | undefined;
  acronym?: string | null | undefined;
}) {
  return {
    ...(fields.name !== undefined && {
      searchName: foldSearchText(fields.name),
    }),
    ...(fields.city !== undefined && {
      searchCity: foldCity(fields.city),
    }),
    ...(fields.acronym !== undefined && {
      searchAcronym: foldSearchTextOrNull(fields.acronym),
    }),
  };
}

function facultySearchFields(fields: {
  name?: string | undefined;
  city?: string | null | undefined;
}) {
  return {
    ...(fields.name !== undefined && {
      searchName: foldSearchText(fields.name),
    }),
    ...(fields.city !== undefined && {
      searchCity: fields.city === null ? null : foldCity(fields.city),
    }),
  };
}

function studyProgramSearchFields(fields: {
  name?: string | undefined;
  language?: string | null | undefined;
}) {
  return {
    ...(fields.name !== undefined && {
      searchName: foldSearchText(fields.name),
    }),
    ...(fields.language !== undefined && {
      searchLanguage: foldSearchTextOrNull(fields.language),
    }),
  };
}

function trackSearchFields(fields: { name?: string | undefined }) {
  return {
    ...(fields.name !== undefined && {
      searchName: foldSearchText(fields.name),
    }),
  };
}

export {
  universitySearchFields,
  facultySearchFields,
  studyProgramSearchFields,
  trackSearchFields,
};
