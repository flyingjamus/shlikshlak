import * as React from "react";
import { useContext } from "react";
import { SettingsContext } from "./SettingsContext";
import styles from "./SettingsShared.module.css";
export default function DebuggingSettings(_: {}) {
  const {
    appendComponentStack,
    breakOnConsoleErrors,
    hideConsoleLogsInStrictMode,
    setAppendComponentStack,
    setBreakOnConsoleErrors,
    setShowInlineWarningsAndErrors,
    showInlineWarningsAndErrors,
    sethideConsoleLogsInStrictMode
  } = useContext(SettingsContext);
  return <div className={styles.Settings}>
      <div className={styles.Setting}>
        <label>
          <input type="checkbox" checked={appendComponentStack} onChange={({
          currentTarget
        }) => setAppendComponentStack(currentTarget.checked)} />{' '}
          Append component stacks to console warnings and errors.
        </label>
      </div>

      <div className={styles.Setting}>
        <label>
          <input type="checkbox" checked={showInlineWarningsAndErrors} onChange={({
          currentTarget
        }) => setShowInlineWarningsAndErrors(currentTarget.checked)} />{' '}
          Show inline warnings and errors.
        </label>
      </div>

      <div className={styles.Setting}>
        <label>
          <input type="checkbox" checked={breakOnConsoleErrors} onChange={({
          currentTarget
        }) => setBreakOnConsoleErrors(currentTarget.checked)} />{' '}
          Break on warnings
        </label>
      </div>

      <div className={styles.Setting}>
        <label>
          <input type="checkbox" checked={hideConsoleLogsInStrictMode} onChange={({
          currentTarget
        }) => sethideConsoleLogsInStrictMode(currentTarget.checked)} />{' '}
          Hide logs during second render in Strict Mode
        </label>
      </div>
    </div>;
}
