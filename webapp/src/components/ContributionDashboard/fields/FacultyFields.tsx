import { use } from "react";
import { RootContext } from "../../../contextData/RootContext";
import { DataField } from "../DataField";
import type { ContributionFormDraft } from "../types";

interface FacultyFieldsProps {
  data: ContributionFormDraft;
  setDataField: (
    field: keyof ContributionFormDraft,
    value: string | number | undefined,
  ) => void;
  idPrefix?: string;
}

function FacultyFields({
  data,
  setDataField,
  idPrefix = "",
}: FacultyFieldsProps) {
  const { t } = use(RootContext);

  return (
    <>
      <DataField
        label={t("contribution.dataFields.city")}
        id={`${idPrefix}dataFacultyCity`}
        type="text"
        value={data.city ?? ""}
        onChange={(e) => {
          setDataField("city", e.target.value || undefined);
        }}
      />
      <DataField
        label={t("contribution.dataFields.website")}
        id={`${idPrefix}dataFacultyWebsite`}
        type="url"
        value={data.website ?? ""}
        onChange={(e) => {
          setDataField("website", e.target.value || undefined);
        }}
      />
      <DataField
        label={t("contribution.dataFields.address")}
        id={`${idPrefix}dataFacultyAddress`}
        type="text"
        value={data.address ?? ""}
        onChange={(e) => {
          setDataField("address", e.target.value || undefined);
        }}
      />
      <DataField
        label={t("contribution.dataFields.phone")}
        id={`${idPrefix}dataFacultyPhone`}
        type="tel"
        value={data.phone ?? ""}
        onChange={(e) => {
          setDataField("phone", e.target.value || undefined);
        }}
      />
      <DataField
        label={t("contribution.dataFields.email")}
        id={`${idPrefix}dataFacultyEmail`}
        type="email"
        value={data.email ?? ""}
        onChange={(e) => {
          setDataField("email", e.target.value || undefined);
        }}
      />
    </>
  );
}

export { FacultyFields };
