import { Dependencies } from './sharedTypes'

export function areDepsEqual(deps: Dependencies, prevDeps: Dependencies) {
  return (
    Array.isArray(deps) &&
    Array.isArray(prevDeps) &&
    deps.length === prevDeps.length &&
    deps.every((value, i) => Object.is(value, prevDeps![i]))
  )
}

export function depsRequireUpdate(
  deps: Dependencies | undefined,
  prevDeps: Dependencies | undefined
) {
  return !deps || !prevDeps || !areDepsEqual(deps, prevDeps)
}
