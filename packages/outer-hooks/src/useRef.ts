import { ActiveHook } from './core/OuterHookState'
import { useInternalStatefulHook } from './core/useInternalStatefulHook'

export interface MutableRefObject<T> {
  current: T
}

export interface RefState<T> {
  ref?: MutableRefObject<T>
}

export function useRef<T>(initialValue: T): MutableRefObject<T>
export function useRef<T = undefined>(): MutableRefObject<T | undefined>
export function useRef<T>(initialValue?: T): MutableRefObject<T> {
  return useInternalStatefulHook('ref', initRefState(initialValue))
    .ref as MutableRefObject<T>
}

const initRefState = <T>(initialValue?: T) => (
  activeHook: ActiveHook
): RefState<T | undefined> => {
  return Object.freeze({
    ref: {
      current: initialValue,
    },
  })
}
