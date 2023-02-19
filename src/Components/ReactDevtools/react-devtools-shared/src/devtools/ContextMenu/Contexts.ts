import { createContext } from "react";
export type ShowFn = (arg0: {
  data: Record<string, any>;
  pageX: number;
  pageY: number;
}) => void;
export type HideFn = () => void;
export type OnChangeFn = (arg0: boolean) => void;
const idToShowFnMap = new Map<string, ShowFn>();
const idToHideFnMap = new Map<string, HideFn>();
let currentHide: HideFn | null | undefined = null;
let currentOnChange: OnChangeFn | null | undefined = null;

function hideMenu() {
  if (typeof currentHide === 'function') {
    currentHide();

    if (typeof currentOnChange === 'function') {
      currentOnChange(false);
    }
  }

  currentHide = null;
  currentOnChange = null;
}

function showMenu({
  data,
  id,
  onChange,
  pageX,
  pageY
}: {
  data: Record<string, any>;
  id: string;
  onChange?: OnChangeFn;
  pageX: number;
  pageY: number;
}) {
  const showFn = idToShowFnMap.get(id);

  if (typeof showFn === 'function') {
    // Prevent open menus from being left hanging.
    hideMenu();
    currentHide = idToHideFnMap.get(id);
    showFn({
      data,
      pageX,
      pageY
    });

    if (typeof onChange === 'function') {
      currentOnChange = onChange;
      onChange(true);
    }
  }
}

function registerMenu(id: string, showFn: ShowFn, hideFn: HideFn) {
  if (idToShowFnMap.has(id)) {
    throw Error(`Context menu with id "${id}" already registered.`);
  }

  idToShowFnMap.set(id, showFn);
  idToHideFnMap.set(id, hideFn);
  return function unregisterMenu() {
    idToShowFnMap.delete(id);
    idToHideFnMap.delete(id);
  };
}

export type RegistryContextType = {
  hideMenu: typeof hideMenu;
  showMenu: typeof showMenu;
  registerMenu: typeof registerMenu;
};
export const RegistryContext = createContext<RegistryContextType>({
  hideMenu,
  showMenu,
  registerMenu
});