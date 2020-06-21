import { ActiveHook, outerHookState } from './OuterHookState'
import { Dispatch } from '../useReducer'

export interface ReducerState {
  value: any
  dispatch: Dispatch<any>
}

export interface EffectState {
  lastDeps: any[]
}

export interface HookState {
  reducer?: ReducerState
  effect?: EffectState
}

export const HookStates = new WeakMap<ActiveHook, HookState[]>()
export type InitHookStateFn<Type extends keyof HookState> = (currentHook: ActiveHook) => HookState[Type]

export function useInternalStatefulHook<Type extends keyof HookState>(type: Type, initFn: InitHookStateFn<Type>) {
  if (!outerHookState.currentHook) {
    throw new Error('please wrap your outer hook in a HookRoot')
  }
  const { currentHook, currentIndex } = outerHookState
  const currentHookStates = HookStates.get(outerHookState.currentHook) || []

  if (currentHookStates[currentIndex] === undefined || !(type in currentHookStates[currentIndex])) {
    currentHookStates[currentIndex] = currentHookStates[currentIndex] || {}
    currentHookStates[currentIndex][type] = initFn(currentHook)
    HookStates.set(outerHookState.currentHook, currentHookStates)
  }

  try {
    return currentHookStates[currentIndex][type]!
  } finally {
    outerHookState.currentIndex++
  }
}
