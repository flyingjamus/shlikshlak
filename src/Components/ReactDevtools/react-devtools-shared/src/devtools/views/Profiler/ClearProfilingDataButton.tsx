import * as React from "react";
import { useContext } from "react";
import { ProfilerContext } from "./ProfilerContext";
import Button from "../Button";
import ButtonIcon from "../ButtonIcon";
import { StoreContext } from "../context";
import { TimelineContext } from "react-devtools-timeline/src/TimelineContext";
export default function ClearProfilingDataButton() {
  const store = useContext(StoreContext);
  const {
    didRecordCommits,
    isProfiling
  } = useContext(ProfilerContext);
  const {
    file,
    setFile
  } = useContext(TimelineContext);
  const {
    profilerStore
  } = store;
  const doesHaveInMemoryData = didRecordCommits;
  const doesHaveUserTimingData = file !== null;

  const clear = () => {
    if (doesHaveInMemoryData) {
      profilerStore.clear();
    }

    if (doesHaveUserTimingData) {
      setFile(null);
    }
  };

  return <Button disabled={isProfiling || !(doesHaveInMemoryData || doesHaveUserTimingData)} onClick={clear} title="Clear profiling data">
      <ButtonIcon type="clear" />
    </Button>;
}