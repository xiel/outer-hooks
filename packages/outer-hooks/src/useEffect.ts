import { areDepsEqual, depsRequireUpdate } from './Internal/areDepsEqual'
import { ActiveHook } from './Internal/OuterHookState'
import { Dependencies } from './Internal/sharedTypes'
import { useInternalStatefulHook } from './Internal/useInternalStatefulHook'

export interface EffectState extends Pick<ActiveHook, 'afterRenderEffects' | 'afterDestroyEffects'> {
  lastDeps?: any[]
  cleanupFn?: () => void
}

export function useEffect(effect: () => void | (() => void)): void
export function useEffect(effect: () => void | (() => void), deps: Dependencies): void
export function useEffect(effect: () => void | (() => void), deps?: Dependencies): void {
  useInternalEffect(effect, deps, false)
}

export function useLayoutEffect(effect: () => void | (() => void)): void
export function useLayoutEffect(effect: () => void | (() => void), deps: Dependencies): void
export function useLayoutEffect(effect: () => void | (() => void), deps?: Dependencies) {
  useInternalEffect(effect, deps, true)
}

function useInternalEffect(effect: () => void | (() => void), deps: Dependencies | undefined, isLayout: boolean) {
  const hookState = useInternalStatefulHook('effect', (currentHook) => {
    const { afterRenderEffects, afterDestroyEffects } = currentHook
    return {
      afterRenderEffects,
      afterDestroyEffects,
      lastDeps: undefined,
      cleanupFn: undefined,
    }
  })!

  if (depsRequireUpdate(deps, hookState.lastDeps)) {
    const renderEffect = () => {
      hookState.lastDeps = deps

      if (isLayout) {
        runEffectAndAddCleanup()
      } else {
        requestAnimationFrame(runEffectAndAddCleanup)
      }

      function runEffectAndAddCleanup() {
        hookState.cleanupFn && hookState.cleanupFn()
        const cleanupFnReturned = effect()
        hookState.cleanupFn = cleanup
        hookState.afterDestroyEffects.add(cleanup)

        function cleanup() {
          if (typeof cleanupFnReturned === 'function') {
            cleanupFnReturned()
          }
          hookState.afterDestroyEffects.delete(cleanup)
        }
      }
    }

    hookState.afterRenderEffects.add(renderEffect)
  }
}
