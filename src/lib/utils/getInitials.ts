export function getInitials(name: string, maxInitials = 2) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const initials = parts
    .map((part) => part[0].toUpperCase())
    .slice(0, maxInitials)
    .join("");
  return initials || "U";
}