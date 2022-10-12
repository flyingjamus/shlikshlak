import * as React from "react";
import styles from "./Profiler.module.css";
export default function ProfilingNotSupported() {
  return <div className={styles.Column}>
      <div className={styles.Header}>Profiling not supported.</div>
      <p className={styles.Paragraph}>
        Profiling support requires either a development or profiling build of
        React v16.5+.
      </p>
      <p className={styles.Paragraph}>
        Learn more at{' '}
        <a className={styles.Link} href="https://fb.me/react-devtools-profiling" rel="noopener noreferrer" target="_blank">
          reactjs.org/link/profiling
        </a>
        .
      </p>
    </div>;
}
