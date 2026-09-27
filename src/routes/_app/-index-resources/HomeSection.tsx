import classNames from "classnames";
import type { PropsWithChildren } from "react";

interface Props {
  /** Tints bg with the site accent color. */
  tinted?: boolean;
  className?: string;
}

/** Shared frame for sections on homepage to unify width/padding. */
export const HomeSection = ({
  tinted,
  className,
  children,
}: PropsWithChildren<Props>) => (
  <section
    className={classNames(
      "home-section",
      tinted && "home-section--tinted",
      className,
    )}
  >
    <div className="home-section__inner">{children}</div>
  </section>
);

/** "1,204 taxa", or nothing when there are none to count. */
export const formatCount = (n: number, singular: string, plural: string) =>
  n > 0 ? `${n.toLocaleString()} ${n === 1 ? singular : plural}` : "";
