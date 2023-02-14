import * as React from "react";
import Button from "../Button";
import ButtonIcon from "../ButtonIcon";
import styles from "./ExpandCollapseToggle.module.css";
type ExpandCollapseToggleProps = {
  disabled: boolean;
  isOpen: boolean;
  setIsOpen: (...args: Array<any>) => any;
};
export default function ExpandCollapseToggle({
  disabled,
  isOpen,
  setIsOpen
}: ExpandCollapseToggleProps) {
  return <Button className={styles.ExpandCollapseToggle} disabled={disabled} onClick={() => setIsOpen(prevIsOpen => !prevIsOpen)} title={`${isOpen ? 'Collapse' : 'Expand'} prop value`}>
      <ButtonIcon type={isOpen ? 'expanded' : 'collapsed'} />
    </Button>;
}
