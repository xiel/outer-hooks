import { depsRequireUpdate } from './core/areDepsEqual'
import { Dependencies } from './core/sharedTypes'
import { useInternalStatefulHook } from './core/useInternalStatefulHook'

export interface MemoState {
  value?: any
  lastDeps?: Dependencies
}

function initMemoState(): MemoState {
  return {
    value: undefined,
    lastDeps: undefined,
  }
}

export function useMemo<T>(
  factory: () => T,
  deps: Dependencies | undefined
): T {
  const hookState = useInternalStatefulHook('memo', initMemoState)
  let value: T

  if (depsRequireUpdate(deps, hookState.lastDeps)) {
    value = hookState.value = factory()
    hookState.lastDeps = deps
  } else {
    value = hookState.value
  }

  return value
}
