import * as React from "react";
import styles from "./HocBadges.module.css";
import type { Element } from "./types";
type Props = {
  element: Element;
};
export default function HocBadges({
  element
}: Props) {
  const {
    hocDisplayNames
  } = ((element as any) as Element);

  if (hocDisplayNames === null) {
    return null;
  }

  return <div className={styles.HocBadges}>
      {hocDisplayNames !== null && hocDisplayNames.map(hocDisplayName => <div key={hocDisplayName} className={styles.Badge}>
            {hocDisplayName}
          </div>)}
    </div>;
}
