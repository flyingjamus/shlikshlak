import { copy } from "clipboard-js";
import * as React from "react";
import Button from "../Button";
import ButtonIcon from "../ButtonIcon";
import KeyValue from "./KeyValue";
import { alphaSortEntries, serializeDataForCopy } from "../utils";
import Store from "../../store";
import styles from "./InspectedElementSharedStyles.module.css";
import type { InspectedElement } from "./types";
import type { FrontendBridge } from "react-devtools-shared/src/bridge";
import type { Element } from "react-devtools-shared/src/devtools/views/Components/types";
type Props = {
  bridge: FrontendBridge;
  element: Element;
  inspectedElement: InspectedElement;
  store: Store;
};
export default function InspectedElementStateTree({
  bridge,
  element,
  inspectedElement,
  store
}: Props) {
  const {
    state
  } = inspectedElement;
  const entries = state != null ? Object.entries(state) : null;

  if (entries !== null) {
    entries.sort(alphaSortEntries);
  }

  const isEmpty = entries === null || entries.length === 0;

  const handleCopy = () => copy(serializeDataForCopy(((state as any) as Record<string, any>)));

  if (isEmpty) {
    return null;
  } else {
    return <div className={styles.InspectedElementTree}>
        <div className={styles.HeaderRow}>
          <div className={styles.Header}>state</div>
          {!isEmpty && <Button onClick={handleCopy} title="Copy to clipboard">
              <ButtonIcon type="copy" />
            </Button>}
        </div>
        {isEmpty && <div className={styles.Empty}>None</div>}
        {!isEmpty && (entries as any).map(([name, value]) => <KeyValue key={name} alphaSort={true} bridge={bridge} canDeletePaths={true} canEditValues={true} canRenamePaths={true} depth={1} element={element} hidden={false} inspectedElement={inspectedElement} name={name} path={[name]} pathRoot="state" store={store} value={value} />)}
      </div>;
  }
}
