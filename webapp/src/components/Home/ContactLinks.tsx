import {
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
}: {
  website?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}) {
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
        <ExternalLink
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
          className={touchTarget}
        >
          <HomeIcon /> {address}
        </ExternalLink>
      )}
      {phone && (
        <ExternalLink
          href={`tel:${phone}`}
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
    </>
  );
}

export { ContactLinks };
