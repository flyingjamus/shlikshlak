import * as React from "react";
import { useContext } from "react";
import Button from "../Button";
import ButtonIcon from "../ButtonIcon";
import { ProfilerContext } from "./ProfilerContext";
import styles from "./RecordToggle.module.css";
export type Props = {
  disabled?: boolean;
};
export default function RecordToggle({
  disabled
}: Props) {
  const {
    isProfiling,
    startProfiling,
    stopProfiling
  } = useContext(ProfilerContext);
  let className = styles.InactiveRecordToggle;

  if (disabled) {
    className = styles.DisabledRecordToggle;
  } else if (isProfiling) {
    className = styles.ActiveRecordToggle;
  }

  return <Button className={className} disabled={disabled} onClick={isProfiling ? stopProfiling : startProfiling} testName="ProfilerToggleButton" title={isProfiling ? 'Stop profiling' : 'Start profiling'}>
      <ButtonIcon type="record" />
    </Button>;
}
