import * as React from "react";
import LoadingAnimation from "../../../../src/devtools/views/Components/LoadingAnimation";
import styles from "./shared.module.css";
export default function SearchingGitHubIssues() {
  return <div className={styles.GitHubLinkRow}>
      <LoadingAnimation className={styles.LoadingIcon} />
      Searching GitHub for reports of this error...
    </div>;
}
