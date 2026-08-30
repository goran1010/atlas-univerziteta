/** Website / address / phone / email links for a university or faculty. */
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
          className="text-blue-600 dark:text-blue-400 hover:underline truncate max-w-xs"
        >
          🌐 {website}
        </a>
      )}
      {address && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          🏠 {address}
        </a>
      )}
      {phone && (
        <a href={`tel:${phone}`} className="hover:underline">
          📞 {phone}
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="text-blue-600 dark:text-blue-400 hover:underline truncate max-w-xs"
        >
          ✉️ {email}
        </a>
      )}
    </>
  );
}

export { ContactLinks };
