import type { FrontendBridge } from "react-devtools-shared/src/bridge";
type Shell = {
  connect: (callback: (...args: Array<any>) => any) => void;
  onReload: (reloadFn: (...args: Array<any>) => any) => void;
};
export function initDevTools(shell: Shell) {
  shell.connect((bridge: FrontendBridge) => {// TODO ...
  });
}