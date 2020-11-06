import { useInternalStatefulHook } from './core/useInternalStatefulHook'

export type Dispatch<A> = (value: A) => void
export type ReducerFn<State, Action> = (state: State, action: Action) => State

export interface ReducerState {
  value: any
  dispatch: Dispatch<any>
}

export function useReducer<State, Action>(
  reducer: ReducerFn<State, Action>,
  initialState: State
): [State, Dispatch<Action>]

export function useReducer<State, Action, InitialArg>(
  reducer: ReducerFn<State, Action>,
  initialArg: InitialArg,
  initStateFn: (initArg: InitialArg) => State
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

    const reducerState: ReducerState = {
      value: initialState,
      dispatch,
    }

    function dispatch(action: Action) {
      const newValue = reducer(reducerState.value, action)
      if (!Object.is(reducerState.value, newValue)) {
        reducerState.value = newValue
        currentHook.requestRender(true)
      }
    }

    return reducerState
  })

  return [hookState.value, hookState.dispatch]
}
