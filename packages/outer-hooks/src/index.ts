export * from './HookRoot/HookRoot'

export function useState<T>(defaultValue?: T) {
  const set = (param: T) => {}

  return [defaultValue, set]
}

export function useEffect() {}

export function useLayoutEffect() {}
