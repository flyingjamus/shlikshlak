import type { GitHubIssue } from "./githubAPI";
import * as React from "react";
import Icon from "../Icon";
import styles from "./shared.module.css";
export default function UpdateExistingIssue({
  gitHubIssue
}: {
  gitHubIssue: GitHubIssue;
}) {
  const {
    title,
    url
  } = gitHubIssue;
  return <div className={styles.GitHubLinkRow}>
      <Icon className={styles.ReportIcon} type="bug" />
      <div className={styles.UpdateExistingIssuePrompt}>
        Update existing issue:
      </div>
      <a className={styles.ReportLink} href={url} rel="noopener noreferrer" target="_blank" title="Report bug">
        {title}
      </a>
    </div>;
}
