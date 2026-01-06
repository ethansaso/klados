type Size = "1" | "2" | "3" | "4";
type ResponsiveSize = {
  initial?: Size;
  sm?: Size;
  md?: Size;
  lg?: Size;
  xl?: Size;
};

function isResponsiveSize(x: unknown): x is ResponsiveSize {
  return typeof x === "object" && x !== null;
}

export function spacingClasses(spacing: Size | ResponsiveSize) {
  if (!isResponsiveSize(spacing)) {
    return [`spacing-initial-${spacing}`];
  }

  const classes: string[] = [];
  if (spacing.initial) classes.push(`spacing-initial-${spacing.initial}`);
  if (spacing.sm) classes.push(`spacing-sm-${spacing.sm}`);
  if (spacing.md) classes.push(`spacing-md-${spacing.md}`);
  if (spacing.lg) classes.push(`spacing-lg-${spacing.lg}`);
  if (spacing.xl) classes.push(`spacing-xl-${spacing.xl}`);

  return classes;
}
