import { createContext } from "react";
import type { ViewUrlSource } from "react-devtools-shared/src/devtools/views/DevTools";
export type Context = {
  viewUrlSourceFunction: ViewUrlSource | null;
};
const ViewSourceContext = createContext<Context>(((null as any) as Context));
ViewSourceContext.displayName = 'ViewSourceContext';
export default ViewSourceContext;