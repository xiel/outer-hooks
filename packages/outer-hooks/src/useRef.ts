import { useInternalStatefulHook } from './Internal/useInternalStatefulHook'

export interface MutableRefObject<T> {
  current: T
}

export interface RefState<T> {
  ref?: MutableRefObject<T>
}

export function useRef<T>(initialValue: T): MutableRefObject<T>
export function useRef<T = undefined>(): MutableRefObject<T | undefined>
export function useRef<T>(initialValue?: T): MutableRefObject<T> {
  return useInternalStatefulHook('ref', () => {
    return {
      ref: {
        current: initialValue,
      },
    }
  }).ref as MutableRefObject<T>
}
