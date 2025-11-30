import { SVGProps } from "react";

export type IconProps = Omit<
  SVGProps<SVGSVGElement>,
  "width" | "height" | "color"
> & {
  size?: number | string;
  color?: string;
  title?: string;
};
