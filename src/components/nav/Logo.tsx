interface LogoProps {
  size?: number;
}

export function Logo({ size = 20 }: LogoProps) {
  return <img src="/logos/LogoBrand.svg" alt="" width={size} height={size} />;
}
