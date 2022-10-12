import * as React from "react";
import styles from "./shared.module.css";
type Props = {
  callStack: string | null;
  children: React.ReactNode;
  info: React.ReactNode | null;
  componentStack: string | null;
  errorMessage: string;
};
export default function CaughtErrorView({
  callStack,
  children,
  info,
  componentStack,
  errorMessage
}: Props) {
  return <div className={styles.ErrorBoundary}>
      {children}
      <div className={styles.ErrorInfo}>
        <div className={styles.HeaderRow}>
          <div className={styles.ErrorHeader}>{errorMessage}</div>
        </div>
        {!!info && <div className={styles.InfoBox}>{info}</div>}
        {!!callStack && <div className={styles.ErrorStack}>
            The error was thrown {callStack.trim()}
          </div>}
      </div>
    </div>;
}
