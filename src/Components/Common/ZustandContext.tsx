import React, { createContext as createReactContext, useContext, useRef, createElement } from 'react'
import { createStore, type StoreApi, useStore as useZustandStore } from 'zustand'

type ExtractState<Store> = Store extends { getState: () => infer T } ? T : never

export const createContext = <
  State extends StoreApi<any>,
  Store = ReturnType<ReturnType<typeof createStore<State>>>
>() => {
  const StoreContext = createReactContext<Store | undefined>(undefined)

  const Provider: React.FC<{
    createStore: () => Store
    children?: React.ReactNode
  }> = ({ createStore, children }) => {
    const storeRef = useRef<Store>()
    if (!storeRef.current) {
      storeRef.current = createStore()
    }
    return createElement(StoreContext.Provider, { value: storeRef.current }, children)
  }

  const useStore = <StateSlice extends ExtractState<Store> = ExtractState<Store>>(
    selector: (state: ExtractState<Store>) => StateSlice,
    equalityFn?: (left: StateSlice, right: StateSlice) => boolean
  ) => {
    const store = useContext(StoreContext)
    if (!store) {
      throw new Error('Seems like you have not used zustand provider as an ancestor')
    }
    return useZustandStore(store, selector, equalityFn)
  }

  return {
    Provider,
    useStore,
  }
}
