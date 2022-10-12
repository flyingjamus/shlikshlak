import * as React from "react";
import RecordToggle from "./RecordToggle";
import styles from "./Profiler.module.css";
export default function RecordingInProgress() {
  return <div className={styles.Column}>
      <div className={styles.Header}>Profiling is in progress...</div>
      <div className={styles.Row}>
        Click the record button <RecordToggle /> to stop recording.
      </div>
    </div>;
}
