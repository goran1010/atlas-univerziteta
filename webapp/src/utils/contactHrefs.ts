function telHref(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

function mapsHref(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export { telHref, mapsHref };
