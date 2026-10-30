import { use } from "react";
import { RootContext } from "../../../contextData/RootContext";
import { DataField } from "../DataField";
import { Label } from "../../sharedComponents/Label";
import { Select } from "../../sharedComponents/Select";
import type { ContributionFormDraft } from "../types";
import { COUNTRIES, ENTITIES } from "../../../schemas/domain";
import type { TypeOfChange } from "../../../schemas/domain";

interface UniversityFieldsProps {
  data: ContributionFormDraft;
  typeOfChange: TypeOfChange;
  setDataField: (
    field: keyof ContributionFormDraft,
    value: string | number | undefined,
  ) => void;
}

function UniversityFields({
  data,
  typeOfChange,
  setDataField,
}: UniversityFieldsProps) {
  const { t } = use(RootContext);

  return (
    <>
      <DataField
        label={t("contribution.dataFields.acronym")}
        id="dataAcronym"
        type="text"
        value={data.acronym ?? ""}
        onChange={(e) => {
          setDataField("acronym", e.target.value || undefined);
        }}
      />
      <DataField
        label={t("contribution.dataFields.city")}
        id="dataCity"
        type="text"
        required={typeOfChange === "CREATE"}
        value={data.city ?? ""}
        onChange={(e) => {
          setDataField("city", e.target.value);
        }}
      />
      <div className="flex flex-col gap-1 self-center">
        <div className="flex flex-col gap-1">
          <Label
            htmlFor="dataCountry"
            className="text-center"
            required={typeOfChange === "CREATE"}
          >
            {t("contribution.dataFields.country")}
          </Label>
          <Select
            id="dataCountry"
            value={data.country ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setDataField("country", value || undefined);
              if (value !== "BIH") setDataField("entity", undefined);
            }}
            required={typeOfChange === "CREATE"}
          >
            <option value="">-</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {t(`universitiesPage.countries.${c}`)}
              </option>
            ))}
          </Select>
        </div>
        {data.country === "BIH" && (
          <div className="flex flex-col gap-1">
            <Label
              htmlFor="dataEntity"
              className="text-center"
              required={typeOfChange === "CREATE"}
            >
              {t("contribution.dataFields.entity")}
            </Label>
            <Select
              id="dataEntity"
              value={data.entity ?? ""}
              onChange={(e) => {
                setDataField("entity", e.target.value || undefined);
              }}
              required={typeOfChange === "CREATE"}
            >
              <option value="">-</option>
              {ENTITIES.map((en) => (
                <option key={en} value={en}>
                  {t(`contribution.entities.${en}`)}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <Label
            htmlFor="dataOwnership"
            className="text-center"
            required={typeOfChange === "CREATE"}
          >
            {t("contribution.dataFields.ownership")}
          </Label>
          <Select
            id="dataOwnership"
            value={data.ownership ?? ""}
            onChange={(e) => {
              setDataField("ownership", e.target.value);
            }}
            required={typeOfChange === "CREATE"}
          >
            <option value="">-</option>
            <option value="PUBLIC">
              {t("universitiesPage.ownership.PUBLIC")}
            </option>
            <option value="PRIVATE">
              {t("universitiesPage.ownership.PRIVATE")}
            </option>
          </Select>
        </div>
      </div>
      <DataField
        label={t("contribution.dataFields.foundedYear")}
        id="dataFoundedYear"
        type="text"
        value={data.foundedYear ?? ""}
        onChange={(e) => {
          setDataField("foundedYear", e.target.value || undefined);
        }}
      />
      <DataField
        label={t("contribution.dataFields.website")}
        id="dataWebsite"
        type="url"
        value={data.website ?? ""}
        onChange={(e) => {
          setDataField("website", e.target.value || undefined);
        }}
      />
      <DataField
        label={t("contribution.dataFields.address")}
        id="dataAddress"
        type="text"
        value={data.address ?? ""}
        onChange={(e) => {
          setDataField("address", e.target.value || undefined);
        }}
      />
      <DataField
        label={t("contribution.dataFields.phone")}
        id="dataPhone"
        type="tel"
        value={data.phone ?? ""}
        onChange={(e) => {
          setDataField("phone", e.target.value || undefined);
        }}
      />
      <DataField
        label={t("contribution.dataFields.email")}
        id="dataEmail"
        type="email"
        value={data.email ?? ""}
        onChange={(e) => {
          setDataField("email", e.target.value || undefined);
        }}
      />
    </>
  );
}

export { UniversityFields };
