import { depsRequireUpdate } from './core/areDepsEqual'
import { isEffectEnvironment } from './core/env'
import { ActiveHook, Effect } from './core/OuterHookState'
import { createRef, RefObject } from './core/refObject'
import { Dependencies } from './core/sharedTypes'
import {
  InitHookStateFn,
  useInternalStatefulHook,
} from './core/useInternalStatefulHook'

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

interface ActiveHookEffectRunner {
  render: HookEffects
  destroy: HookEffects
  runRenderEffects: Effect
  runDestroyEffects: Effect
}

const ActiveHookEffectsMap = new WeakMap<ActiveHook, ActiveHookEffectRunner>()

type RenderEffects = Set<Effect>
type DestroyEffects = Set<Effect>
type LastDeps = RefObject<Dependencies | undefined>
type CleanUpFn = RefObject<Effect | undefined>

export type EffectState = [
  ActiveHook,
  ActiveHookEffectRunner,
  RenderEffects,
  DestroyEffects,
  LastDeps,
  CleanUpFn
]

const callEffect = (effect: Effect) => effect()

function createHookEffects(): HookEffects {
  const effects: Effect[] = []
  const layoutEffects: Effect[] = []
  const runEffects = () => effects.forEach(callEffect)
  const runLayoutEffects = () => layoutEffects.forEach(callEffect)
  return {
    effects,
    layoutEffects,
    runEffects,
    runLayoutEffects,
  }
}

function createActiveHookEffectRunner(): ActiveHookEffectRunner {
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

function initEffectState(isLayout: boolean) {
  const initEffectStateFn: InitHookStateFn<'effect'> = (
    activeHook,
    currentIndex
  ) => {
    let hooksEffects: ActiveHookEffectRunner

    if (ActiveHookEffectsMap.has(activeHook)) {
      hooksEffects = ActiveHookEffectsMap.get(activeHook)!
    } else {
      hooksEffects = createActiveHookEffectRunner()
      ActiveHookEffectsMap.set(activeHook, hooksEffects)
    }

    const renderEffects = new Set<Effect>()
    const destroyEffects = new Set<Effect>()
    const lastDeps = createRef<Dependencies | undefined>(undefined)
    const cleanupFn = createRef<Effect | undefined>(undefined)
    const effectsToUse = isLayout ? 'layoutEffects' : 'effects'

    hooksEffects.render[effectsToUse][currentIndex] = () => {
      renderEffects.forEach(callEffect)
      renderEffects.clear()
    }

    hooksEffects.destroy[effectsToUse][currentIndex] = () => {
      destroyEffects.forEach(callEffect)
      destroyEffects.clear()
    }

    return [
      activeHook,
      hooksEffects,
      renderEffects,
      destroyEffects,
      lastDeps,
      cleanupFn,
    ]
  }
  return initEffectStateFn
}

function useInternalEffect(
  effect: () => void | (() => void),
  deps: Dependencies | undefined,
  isLayout: boolean
) {
  const [
    activeHook,
    hooksEffects,
    renderEffects,
    destroyEffects,
    lastDeps,
    cleanupFn,
  ] = useInternalStatefulHook('effect', initEffectState(isLayout))!

  if (isEffectEnvironment && depsRequireUpdate(deps, lastDeps.ref.current)) {
    const renderEffect = () => {
      lastDeps.ref.current = deps

      if (isLayout) {
        runEffectAndAddCleanup()
      } else {
        // prevent that this is ever called, when destroyed before rAF
        // TODO: maybe cheaper to just check for destroyed state in runEffect?
        const rafId = requestAnimationFrame(runEffectAndAddCleanup)
        destroyEffects.add(() => cancelAnimationFrame(rafId))
      }

      function runEffectAndAddCleanup() {
        if (typeof cleanupFn.ref.current !== 'undefined') {
          cleanupFn.ref.current()
        }

        const cleanupFnReturned = effect()

        // TODO: only do this when there is actually a function returned
        cleanupFn.ref.current = cleanup
        destroyEffects.add(cleanup)

        function cleanup() {
          if (typeof cleanupFnReturned === 'function') {
            cleanupFnReturned()
          }
          destroyEffects.delete(cleanup)
        }
      }
    }
    renderEffects.add(renderEffect)
  }

  if (isEffectEnvironment) {
    activeHook.afterRenderEffects.add(hooksEffects.runRenderEffects)
    activeHook.afterDestroyEffects.add(hooksEffects.runDestroyEffects)
  }
}
