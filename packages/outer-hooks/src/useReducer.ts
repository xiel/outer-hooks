import { ActiveHook, outerHookState } from './OuterHookState'

export type Dispatch<A> = (value: A) => void
export type ReducerFn<State, Action> = (state: State, action: Action) => State

interface HookState {
  value: any
  dispatch: Dispatch<any>
}

export const HookStates = new WeakMap<ActiveHook, HookState[]>()

export function useReducer<State, Action>(
  reducer: ReducerFn<State, Action>,
  initialState: State
): [State, Dispatch<Action>]

export function useReducer<State, Action, InitialArg>(
  reducer: ReducerFn<State, Action>,
  initialArg: InitialArg,
  initStateFn: (initialArg: InitialArg) => State
): [State, Dispatch<Action>]

export function useReducer<State, Action, InitialArg>(
  reducer: ReducerFn<State, Action>,
  initialStateOrInitialArg: State | InitialArg,
  maybeInitStateFn?: (initialArg: InitialArg) => State
): [State, Dispatch<Action>] {
  if (!outerHookState.currentHook) {
    throw new Error('please wrap your outer hook in a HookRoot')
  }
  const { currentHook, currentIndex } = outerHookState
  const hookStates = HookStates.get(outerHookState.currentHook) || []
  let hookState = hookStates[currentIndex]

  if (!hookState) {
    let initialState: State = maybeInitStateFn
      ? maybeInitStateFn(initialStateOrInitialArg as InitialArg)
      : (initialStateOrInitialArg as State)

    const dispatch: Dispatch<Action> = (action) => {
      const newValue = reducer(hookState.value, action)
      if (!Object.is(hookState.value, newValue)) {
        hookState.value = newValue
        currentHook.requestRender()
      }
    }

    hookState = hookStates[currentIndex] = {
      value: initialState,
      dispatch,
    }

    HookStates.set(outerHookState.currentHook, hookStates)
  }

  try {
    return [hookState.value, hookState.dispatch]
  } finally {
    outerHookState.currentIndex++
  }
}
