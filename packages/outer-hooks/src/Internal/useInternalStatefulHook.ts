import { EffectState } from '../useEffect'
import { MemoState } from '../useMemo'
import { ReducerState } from '../useReducer'
import { RefState } from '../useRef'
import { ActiveHook, outerHookState } from './OuterHookState'

export interface HookState {
  reducer?: ReducerState
  effect?: EffectState
  memo?: MemoState
  ref?: RefState<unknown>
}

export const HookStates = new WeakMap<ActiveHook, HookState[]>()
export type InitHookStateFn<Type extends keyof HookState> = (
  currentHook: ActiveHook
) => HookState[Type]

console.log('HookStates', HookStates)

export function useInternalStatefulHook<Type extends keyof HookState>(
  type: Type,
  initFn: InitHookStateFn<Type>
): NonNullable<HookState[Type]> {
  if (!outerHookState.currentHook) {
    throw new Error('please wrap your outer hook in a HookRoot')
  }
  const { currentHook, currentIndex } = outerHookState
  const currentHookStates = HookStates.get(outerHookState.currentHook) || []

  if (
    currentHookStates[currentIndex] === undefined ||
    !(type in currentHookStates[currentIndex])
  ) {
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
