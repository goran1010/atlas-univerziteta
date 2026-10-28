import { use } from "react";
import { mapsHref, telHref } from "../../utils/contactHrefs";
import { RootContext } from "../../contextData/RootContext";
import {
  BookOpenIcon,
  EnvelopeIcon,
  GlobeIcon,
  HomeIcon,
  PhoneIcon,
} from "../sharedComponents/icons";
import { ExternalLink } from "../sharedComponents/ExternalLink";

const touchTarget = "inline-block py-1";

function ContactLinks({
  website,
  address,
  phone,
  email,
  dataSourceUrl,
}: {
  website?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  dataSourceUrl?: string | null;
}) {
  const { t } = use(RootContext);

  return (
    <>
      {website && (
        <ExternalLink
          href={website}
          className={`truncate max-w-xs ${touchTarget}`}
        >
          <GlobeIcon /> {website}
        </ExternalLink>
      )}
      {address && (
        <ExternalLink href={mapsHref(address)} className={touchTarget}>
          <HomeIcon /> {address}
        </ExternalLink>
      )}
      {phone && (
        <ExternalLink
          href={telHref(phone)}
          newTab={false}
          className={touchTarget}
        >
          <PhoneIcon /> {phone}
        </ExternalLink>
      )}
      {email && (
        <ExternalLink
          href={`mailto:${email}`}
          newTab={false}
          className={`truncate max-w-xs ${touchTarget}`}
        >
          <EnvelopeIcon size="1em" /> {email}
        </ExternalLink>
      )}
      {dataSourceUrl && (
        <ExternalLink href={dataSourceUrl} className={touchTarget}>
          <BookOpenIcon /> {t("universitiesPage.dataSource")}
        </ExternalLink>
      )}
    </>
  );
}

export { ContactLinks };
