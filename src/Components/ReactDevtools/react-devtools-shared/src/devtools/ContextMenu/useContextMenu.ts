import { useContext, useEffect } from "react";
import { RegistryContext } from "./Contexts";
import type { OnChangeFn, RegistryContextType } from "./Contexts";
import type { ElementRef } from "react";
export default function useContextMenu({
  data,
  id,
  onChange,
  ref
}: {
  data: Record<string, any>;
  id: string;
  onChange?: OnChangeFn;
  ref: {
    current: ElementRef<any> | null;
  };
}) {
  const {
    showMenu
  } = useContext<RegistryContextType>(RegistryContext);
  useEffect(() => {
    if (ref.current !== null) {
      const handleContextMenu = (event: MouseEvent | TouchEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const pageX = (event as any).pageX || event.touches && (event as any).touches[0].pageX;
        const pageY = (event as any).pageY || event.touches && (event as any).touches[0].pageY;
        showMenu({
          data,
          id,
          onChange,
          pageX,
          pageY
        });
      };

      const trigger = ref.current;
      trigger.addEventListener('contextmenu', handleContextMenu);
      return () => {
        trigger.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, [data, id, showMenu]);
}