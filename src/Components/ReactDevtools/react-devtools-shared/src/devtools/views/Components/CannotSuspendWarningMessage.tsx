import * as React from "react";
import { useContext } from "react";
import { StoreContext } from "../context";
import { ComponentFilterElementType, ElementTypeSuspense } from "../../../types";
export default function CannotSuspendWarningMessage() {
  const store = useContext(StoreContext);
  const areSuspenseElementsHidden = !!store.componentFilters.find(filter => filter.type === ComponentFilterElementType && filter.value === ElementTypeSuspense && filter.isEnabled);

  // Has the user filtered out Suspense nodes from the tree?
  // If so, the selected element might actually be in a Suspense tree after all.
  if (areSuspenseElementsHidden) {
    return <div>
        Suspended state cannot be toggled while Suspense components are hidden.
        Disable the filter and try again.
      </div>;
  } else {
    return <div>
        The selected element is not within a Suspense container. Suspending it
        would cause an error.
      </div>;
  }
}
