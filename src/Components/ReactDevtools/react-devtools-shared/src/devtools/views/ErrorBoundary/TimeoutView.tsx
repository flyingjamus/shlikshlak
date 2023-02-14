import * as React from "react";
import Button from "../Button";
import ButtonIcon from "../ButtonIcon";
import styles from "./shared.module.css";
type Props = {
  callStack: string | null;
  children: React.ReactNode;
  componentStack: string | null;
  dismissError: (...args: Array<any>) => any;
  errorMessage: string | null;
};
export default function TimeoutView({
  callStack,
  children,
  componentStack,
  dismissError = null,
  errorMessage
}: Props) {
  return <div className={styles.ErrorBoundary}>
      {children}
      <div className={styles.ErrorInfo}>
        <div className={styles.HeaderRow}>
          <div className={styles.TimeoutHeader}>
            {errorMessage || 'Timed out waiting'}
          </div>
          <Button className={styles.CloseButton} onClick={dismissError}>
            Retry
            <ButtonIcon className={styles.CloseButtonIcon} type="close" />
          </Button>
        </div>
        {!!componentStack && <div className={styles.TimeoutStack}>
            The timeout occurred {componentStack.trim()}
          </div>}
      </div>
    </div>;
}
