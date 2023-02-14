import * as React from "react";
import styles from "./Button.module.css";
import Tooltip from "./Components/reach-ui/tooltip";
type Props = {
  children: React.ReactNode;
  className?: string;
  testName?: string | null | undefined;
  title: React.ReactNode;
};
export default function Button({
  children,
  className = '',
  testName,
  title,
  ...rest
}: Props) {
  let button = <button className={`${styles.Button} ${className}`} data-testname={testName} {...rest}>
      <span className={`${styles.ButtonContent} ${className}`} tabIndex={-1}>
        {children}
      </span>
    </button>;

  if (title) {
    button = <Tooltip label={title}>{button}</Tooltip>;
  }

  return button;
}
