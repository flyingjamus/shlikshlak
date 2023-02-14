import * as React from "react";
import { useContext } from "react";
import { RegistryContext } from "./Contexts";
import styles from "./ContextMenuItem.module.css";
import type { RegistryContextType } from "./Contexts";
type Props = {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
};
export default function ContextMenuItem({
  children,
  onClick,
  title
}: Props) {
  const {
    hideMenu
  } = useContext<RegistryContextType>(RegistryContext);

  const handleClick = event => {
    onClick();
    hideMenu();
  };

  return <div className={styles.ContextMenuItem} onClick={handleClick} onTouchEnd={handleClick}>
      {children}
    </div>;
}
