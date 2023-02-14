import * as React from "react";
import styles from "./NoCommitData.module.css";
export default function NoCommitData(_: {}) {
  return <div className={styles.NoCommitData}>
      <div className={styles.Header}>
        There is no data matching the current filter criteria.
      </div>
      <div className={styles.FilterMessage}>
        Try adjusting the commit filter in Profiler settings.
      </div>
    </div>;
}
