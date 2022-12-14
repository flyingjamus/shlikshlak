import * as React from "react";
import { useCallback, useContext, useMemo, useRef } from "react";
import { useSubscription } from "../hooks";
import { StoreContext } from "../context";
import { ProfilerContext } from "react-devtools-shared/src/devtools/views/Profiler/ProfilerContext";
import styles from "./SettingsShared.module.css";
export default function ProfilerSettings(_: {}) {
  const {
    isCommitFilterEnabled,
    minCommitDuration,
    setIsCommitFilterEnabled,
    setMinCommitDuration
  } = useContext(ProfilerContext);
  const store = useContext(StoreContext);
  const recordChangeDescriptionsSubscription = useMemo(() => ({
    getCurrentValue: () => store.recordChangeDescriptions,
    subscribe: (callback: (...args: Array<any>) => any) => {
      store.addListener('recordChangeDescriptions', callback);
      return () => store.removeListener('recordChangeDescriptions', callback);
    }
  }), [store]);
  const recordChangeDescriptions = useSubscription<boolean>(recordChangeDescriptionsSubscription);
  const updateRecordChangeDescriptions = useCallback(({
    currentTarget
  }) => {
    store.recordChangeDescriptions = currentTarget.checked;
  }, [store]);
  const updateMinCommitDuration = useCallback((event: React.SyntheticEvent<HTMLInputElement>) => {
    const newValue = parseFloat(event.currentTarget.value);
    setMinCommitDuration(Number.isNaN(newValue) || newValue <= 0 ? 0 : newValue);
  }, [setMinCommitDuration]);
  const updateIsCommitFilterEnabled = useCallback((event: React.SyntheticEvent<HTMLInputElement>) => {
    const checked = event.currentTarget.checked;
    setIsCommitFilterEnabled(checked);

    if (checked) {
      if (minCommitDurationInputRef.current !== null) {
        minCommitDurationInputRef.current.focus();
      }
    }
  }, [setIsCommitFilterEnabled]);
  const minCommitDurationInputRef = useRef<HTMLInputElement | null>(null);
  return <div className={styles.Settings}>
      <div className={styles.Setting}>
        <label>
          <input type="checkbox" checked={recordChangeDescriptions} onChange={updateRecordChangeDescriptions} />{' '}
          Record why each component rendered while profiling.
        </label>
      </div>

      <div className={styles.Setting}>
        <label>
          <input checked={isCommitFilterEnabled} onChange={updateIsCommitFilterEnabled} type="checkbox" />{' '}
          Hide commits below
        </label>{' '}
        <input className={styles.Input} onChange={updateMinCommitDuration} ref={minCommitDurationInputRef} type="number" value={minCommitDuration} />{' '}
        (ms)
      </div>
    </div>;
}
