import * as React from "react";
import { createContext, useMemo, useState } from "react";
export type DisplayDensity = "comfortable" | "compact";
export type Theme = "auto" | "light" | "dark";
type Context = {
  isModalShowing: boolean;
  setIsModalShowing: (value: boolean) => void;
};
const SettingsModalContext = createContext<Context>(((null as any) as Context));
SettingsModalContext.displayName = 'SettingsModalContext';

function SettingsModalContextController({
  children
}: {
  children: React.ReactNode;
}) {
  const [isModalShowing, setIsModalShowing] = useState<boolean>(false);
  const value = useMemo(() => ({
    isModalShowing,
    setIsModalShowing
  }), [isModalShowing, setIsModalShowing]);
  return <SettingsModalContext.Provider value={value}>
      {children}
    </SettingsModalContext.Provider>;
}

export { SettingsModalContext, SettingsModalContextController };