const touchTarget = "inline-block py-1 hover:underline";

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
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-blue-600 dark:text-blue-400 truncate max-w-xs ${touchTarget}`}
        >
          <span aria-hidden="true">🌐</span> {website}
        </a>
      )}
      {address && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={touchTarget}
        >
          <span aria-hidden="true">🏠</span> {address}
        </a>
      )}
      {phone && (
        <a href={`tel:${phone}`} className={touchTarget}>
          <span aria-hidden="true">📞</span> {phone}
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className={`text-blue-600 dark:text-blue-400 truncate max-w-xs ${touchTarget}`}
        >
          <span aria-hidden="true">✉️</span> {email}
        </a>
      )}
    </>
  );
}

export { ContactLinks };
