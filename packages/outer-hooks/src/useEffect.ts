import { depsRequireUpdate } from './core/areDepsEqual'
import { ActiveHook, Effect } from './core/OuterHookState'
import { Dependencies } from './core/sharedTypes'
import { useInternalStatefulHook } from './core/useInternalStatefulHook'

const isEffectEnv = Boolean(
  global?.window?.document?.documentElement && requestAnimationFrame
)

export function useEffect(effect: () => void | (() => void)): void
export function useEffect(
  effect: () => void | (() => void),
  deps: Dependencies
): void
export function useEffect(
  effect: () => void | (() => void),
  deps?: Dependencies
): void {
  useInternalEffect(effect, deps, false)
}

export function useLayoutEffect(effect: () => void | (() => void)): void
export function useLayoutEffect(
  effect: () => void | (() => void),
  deps: Dependencies
): void
export function useLayoutEffect(
  effect: () => void | (() => void),
  deps?: Dependencies
) {
  useInternalEffect(effect, deps, true)
}

interface HookEffects {
  effects: Effect[]
  layoutEffects: Effect[]
  runEffects: Effect
  runLayoutEffects: Effect
}

interface RenderDestroyHookEffects {
  render: HookEffects
  destroy: HookEffects
  runRenderEffects: Effect
  runDestroyEffects: Effect
}

const ActiveHookEffectsMap = new WeakMap<ActiveHook, RenderDestroyHookEffects>()

export interface EffectState {
  activeHook: ActiveHook
  hooksEffects: RenderDestroyHookEffects
  renderEffects: Set<Effect>
  destroyEffects: Set<Effect>
  lastDeps?: Dependencies
  cleanupFn?: () => void
}

function createHookEffects(): HookEffects {
  const effects: Effect[] = []
  const layoutEffects: Effect[] = []
  const runEffects = () => effects.forEach((e) => e())
  const runLayoutEffects = () => layoutEffects.forEach((e) => e())
  return {
    effects,
    layoutEffects,
    runEffects,
    runLayoutEffects,
  }
}

function createRenderDestroyHookEffects(): RenderDestroyHookEffects {
  const render = createHookEffects()
  const destroy = createHookEffects()
  const runRenderEffects = () => {
    render.runLayoutEffects()
    render.runEffects()
  }
  const runDestroyEffects = () => {
    destroy.runLayoutEffects()
    destroy.runEffects()
  }
  return {
    render,
    destroy,
    runRenderEffects,
    runDestroyEffects,
  }
}

function useInternalEffect(
  effect: () => void | (() => void),
  deps: Dependencies | undefined,
  isLayout: boolean
) {
  const effectState = useInternalStatefulHook(
    'effect',
    (activeHook, currentIndex) => {
      let hooksEffects: RenderDestroyHookEffects

      if (ActiveHookEffectsMap.has(activeHook)) {
        hooksEffects = ActiveHookEffectsMap.get(activeHook)!
      } else {
        hooksEffects = createRenderDestroyHookEffects()
        ActiveHookEffectsMap.set(activeHook, hooksEffects)
      }

      const renderEffects = new Set<Effect>()
      const destroyEffects = new Set<Effect>()

      hooksEffects.render[isLayout ? 'layoutEffects' : 'effects'][
        currentIndex
      ] = () => {
        renderEffects.forEach((e) => e())
        renderEffects.clear()
      }

      hooksEffects.destroy[isLayout ? 'layoutEffects' : 'effects'][
        currentIndex
      ] = () => {
        destroyEffects.forEach((e) => e())
        destroyEffects.clear()
      }

      return {
        activeHook,
        hooksEffects,
        renderEffects,
        destroyEffects,
        lastDeps: undefined,
        cleanupFn: undefined,
      }
    }
  )!

  if (isEffectEnv && depsRequireUpdate(deps, effectState.lastDeps)) {
    const renderEffect = () => {
      effectState.lastDeps = deps

      if (isLayout) {
        runEffectAndAddCleanup()
      } else {
        // prevent that this is ever called, when destroyed before rAF
        // TODO: maybe cheaper to just check for destroyed state in runEffect?
        const rafId = requestAnimationFrame(runEffectAndAddCleanup)
        effectState.destroyEffects.add(() => cancelAnimationFrame(rafId))
      }

      function runEffectAndAddCleanup() {
        if (typeof effectState.cleanupFn !== 'undefined') {
          effectState.cleanupFn()
        }

        const cleanupFnReturned = effect()

        // TODO: only do this when there is actually a function returned
        effectState.cleanupFn = cleanup
        effectState.destroyEffects.add(cleanup)

        function cleanup() {
          if (typeof cleanupFnReturned === 'function') {
            cleanupFnReturned()
          }
          effectState.destroyEffects.delete(cleanup)
        }
      }
    }
    effectState.renderEffects.add(renderEffect)
  }

  if (isEffectEnv) {
    effectState.activeHook.afterRenderEffects.add(
      effectState.hooksEffects.runRenderEffects
    )
    effectState.activeHook.afterDestroyEffects.add(
      effectState.hooksEffects.runDestroyEffects
    )
  }
}
