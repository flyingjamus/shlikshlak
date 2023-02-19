import * as React from "react";
import { useCallback, useContext, useMemo } from "react";
import { SettingsModalContext } from "./SettingsModalContext";
import Button from "../Button";
import ButtonIcon from "../ButtonIcon";
import { StoreContext } from "../context";
import { useSubscription } from "../hooks";
export default function SettingsModalContextToggle() {
  const {
    setIsModalShowing
  } = useContext(SettingsModalContext);
  const store = useContext(StoreContext);
  const {
    profilerStore
  } = store;
  const showFilterModal = useCallback(() => setIsModalShowing(true), [setIsModalShowing]);
  // Updating preferences while profiling is in progress could break things (e.g. filtering)
  // Explicitly disallow it for now.
  const isProfilingSubscription = useMemo(() => ({
    getCurrentValue: () => profilerStore.isProfiling,
    subscribe: (callback: (...args: Array<any>) => any) => {
      profilerStore.addListener('isProfiling', callback);
      return () => profilerStore.removeListener('isProfiling', callback);
    }
  }), [profilerStore]);
  const isProfiling = useSubscription<boolean>(isProfilingSubscription);
  return <Button disabled={isProfiling} onClick={showFilterModal} title="View settings">
      <ButtonIcon type="settings" />
    </Button>;
}