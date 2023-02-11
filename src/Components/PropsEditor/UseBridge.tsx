import { useIframeStore } from '../store'

export function useBridge() {
  return useIframeStore((v) => v.bridge)!
}
