interface LogoProps {
  size?: number;
}

export function Logo({ size = 20 }: LogoProps) {
  return (
    <img
      src="/logos/LogoBrand.svg"
      alt="Klados Logo"
      width={size}
      height={size}
    />
  );
}
