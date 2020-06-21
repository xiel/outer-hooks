import { ReducerState, useInternalStatefulHook } from './internal/useInternalStatefulHook'

export type Dispatch<A> = (value: A) => void
export type ReducerFn<State, Action> = (state: State, action: Action) => State

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
  const hookState = useInternalStatefulHook('reducer', (currentHook) => {
    let initialState: State = maybeInitStateFn
      ? maybeInitStateFn(initialStateOrInitialArg as InitialArg)
      : (initialStateOrInitialArg as State)

    const hookState: ReducerState = {
      value: initialState,
      dispatch,
    }

    function dispatch(action: Action) {
      const newValue = reducer(hookState.value, action)
      if (!Object.is(hookState.value, newValue)) {
        hookState.value = newValue
        currentHook.requestRender()
      }
    }

    return hookState
  })

  return [hookState.value, hookState.dispatch]
}
