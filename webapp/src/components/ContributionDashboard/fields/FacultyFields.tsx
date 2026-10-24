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
}

function FacultyFields({ data, setDataField }: FacultyFieldsProps) {
  const { t } = use(RootContext);

  return (
    <>
      <DataField
        label={t("contribution.dataFields.city")}
        id="dataFacultyCity"
        type="text"
        value={data.city ?? ""}
        onChange={(e) => {
          setDataField("city", e.target.value || undefined);
        }}
      />
      <DataField
        label={t("contribution.dataFields.website")}
        id="dataFacultyWebsite"
        type="url"
        value={data.website ?? ""}
        onChange={(e) => {
          setDataField("website", e.target.value || undefined);
        }}
      />
      <DataField
        label={t("contribution.dataFields.address")}
        id="dataFacultyAddress"
        type="text"
        value={data.address ?? ""}
        onChange={(e) => {
          setDataField("address", e.target.value || undefined);
        }}
      />
      <DataField
        label={t("contribution.dataFields.phone")}
        id="dataFacultyPhone"
        type="tel"
        value={data.phone ?? ""}
        onChange={(e) => {
          setDataField("phone", e.target.value || undefined);
        }}
      />
      <DataField
        label={t("contribution.dataFields.email")}
        id="dataFacultyEmail"
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
