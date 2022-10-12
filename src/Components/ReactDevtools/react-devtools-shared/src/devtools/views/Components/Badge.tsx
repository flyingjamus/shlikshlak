import * as React from "react";
import { Fragment } from "react";
import styles from "./Badge.module.css";
import type { ElementType } from "react-devtools-shared/src/types";
type Props = {
  className?: string;
  hocDisplayNames: Array<string> | null;
  type: ElementType;
  children: React.ReactNode;
};
export default function Badge({
  className,
  hocDisplayNames,
  type,
  children
}: Props) {
  if (hocDisplayNames === null || hocDisplayNames.length === 0) {
    return null;
  }

  const totalBadgeCount = hocDisplayNames.length;
  return <Fragment>
      <div className={`${styles.Badge} ${className || ''}`}>{children}</div>
      {totalBadgeCount > 1 && <div className={styles.ExtraLabel}>+{totalBadgeCount - 1}</div>}
    </Fragment>;
}
