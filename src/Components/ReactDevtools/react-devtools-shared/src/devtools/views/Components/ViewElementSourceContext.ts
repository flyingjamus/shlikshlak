import { createContext } from "react";
import type { CanViewElementSource, ViewElementSource } from "react-devtools-shared/src/devtools/views/DevTools";
export type Context = {
  canViewElementSourceFunction: CanViewElementSource | null;
  viewElementSourceFunction: ViewElementSource | null;
};
const ViewElementSourceContext = createContext<Context>(((null as any) as Context));
ViewElementSourceContext.displayName = 'ViewElementSourceContext';
export default ViewElementSourceContext;