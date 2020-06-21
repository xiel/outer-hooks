import { Dispatch, useReducer } from './useReducer'

function stateReducer<S>(prevState: S, action: SetStateAction<S>): S {
  if (action && typeof action === 'function') {
    return (action as (prevState: S) => S)(prevState)
  }
  return action
}

export type LazyValueFn<S> = () => S
export type SetStateAction<S> = S | ((prevState: S) => S)

export function useState<S>(initialState: S | LazyValueFn<S>): [S, Dispatch<SetStateAction<S>>]
export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>]
export function useState<S>(initialState = undefined) {
  if (typeof initialState === 'function') {
    return useReducer<S, SetStateAction<S>, any>(stateReducer, undefined, (initialState as unknown) as LazyValueFn<S>)
  }
  return useReducer<S, SetStateAction<S>>(stateReducer, (initialState as unknown) as S)
}
