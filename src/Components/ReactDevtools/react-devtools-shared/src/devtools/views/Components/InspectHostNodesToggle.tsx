import * as React from "react";
import { useCallback, useContext, useEffect, useState } from "react";
import { BridgeContext } from "../context";
import Toggle from "../Toggle";
import ButtonIcon from "../ButtonIcon";
import { logEvent } from "../../../Logger";
export default function InspectHostNodesToggle() {
  const [isInspecting, setIsInspecting] = useState(false);
  const bridge = useContext(BridgeContext);
  const handleChange = useCallback((isChecked: boolean) => {
    setIsInspecting(isChecked);

    if (isChecked) {
      logEvent({
        event_name: 'inspect-element-button-clicked'
      });
      bridge.send('startInspectingNative');
    } else {
      bridge.send('stopInspectingNative', false);
    }
  }, [bridge]);
  useEffect(() => {
    const onStopInspectingNative = () => setIsInspecting(false);

    bridge.addListener('stopInspectingNative', onStopInspectingNative);
    return () => bridge.removeListener('stopInspectingNative', onStopInspectingNative);
  }, [bridge]);
  return <Toggle onChange={handleChange} isChecked={isInspecting} title="Select an element in the page to inspect it">
      <ButtonIcon type="search" />
    </Toggle>;
}
