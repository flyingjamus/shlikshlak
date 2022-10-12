import * as React from "react";
import styles from "./Profiler.module.css";
export default function ProcessingData() {
  return <div className={styles.Column}>
      <div className={styles.Header}>Processing data...</div>
      <div className={styles.Row}>This should only take a minute.</div>
    </div>;
}
