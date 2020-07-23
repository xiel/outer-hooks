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
    // TODO: put effects onto activeHook directly
    const hooksEffects =
      ActiveHookEffectsMap.get(activeHook) ||
      (() => {
        const hooksEffectsCreated = createActiveHookEffectRunner()
        ActiveHookEffectsMap.set(activeHook, hooksEffectsCreated)
        return hooksEffectsCreated
      })()

    const renderEffects = new Set<Effect>()
    const destroyEffects = new Set<Effect>()
    const lastDeps = createRef<Dependencies>()
    const cleanupFn = createRef<Effect>()
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
  effect: () => void | (() => void | unknown),
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
        requestAnimationFrame(runEffectAndAddCleanup)
      }

      function runEffectAndAddCleanup(): void {
        // hook might be destroyed before rAF effects run
        if (activeHook.hookRoot.state.isDestroyed) {
          return
        }

        let cleanupFnReturned: void | (() => void)

        try {
          if (cleanupFn.ref.current) {
            cleanupFn.ref.current()
            cleanupFn.ref.current = undefined
          }
          cleanupFnReturned = effect()
        } catch (e) {
          return void activeHook.hookRoot.destroy(e)
        }

        if (typeof cleanupFnReturned === 'function') {
          const cleanUp = () => {
            cleanupFnReturned && cleanupFnReturned()
            destroyEffects.delete(cleanUp)
          }
          cleanupFn.ref.current = cleanUp
          destroyEffects.add(cleanUp)
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
