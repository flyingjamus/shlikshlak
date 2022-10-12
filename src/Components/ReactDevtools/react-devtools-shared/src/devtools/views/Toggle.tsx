import * as React from "react";
import { useCallback } from "react";
import styles from "./Toggle.module.css";
import Tooltip from "./Components/reach-ui/tooltip";
type Props = {
  children: React.ReactNode;
  className?: string;
  isChecked: boolean;
  isDisabled?: boolean;
  onChange: (isChecked: boolean) => void;
  testName?: string | null | undefined;
  title?: string;
};
export default function Toggle({
  children,
  className = '',
  isDisabled = false,
  isChecked,
  onChange,
  testName,
  title
}: Props) {
  let defaultClassName;

  if (isDisabled) {
    defaultClassName = styles.ToggleDisabled;
  } else if (isChecked) {
    defaultClassName = styles.ToggleOn;
  } else {
    defaultClassName = styles.ToggleOff;
  }

  const handleClick = useCallback(() => onChange(!isChecked), [isChecked, onChange]);
  let toggle = <button className={`${defaultClassName} ${className}`} data-testname={testName} disabled={isDisabled} onClick={handleClick}>
      <span className={styles.ToggleContent} tabIndex={-1}>
        {children}
      </span>
    </button>;

  if (title) {
    toggle = <Tooltip label={title}>{toggle}</Tooltip>;
  }

  return toggle;
}
