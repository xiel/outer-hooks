import { __DEV__, isEffectEnvironment } from '../core/env'
import { ActiveHook, outerHookState } from '../core/OuterHookState'
import { createPromisedValue, PromisedValue } from '../core/promisedValue'
import { Root, State } from './HookRootTypes'

type OnUpdateFn<HookValue> = (nextValue: HookValue) => void

export function HookRoot<Props extends object | undefined, HookValue>(
  hookFunction: (props: Props) => HookValue,
  initialProps: Props,
  onUpdate?: OnUpdateFn<HookValue>
): Root<Props, HookValue>

export function HookRoot<Props extends undefined, HookValue>(
  hookFunction: (props?: Props) => HookValue,
  onUpdate?: OnUpdateFn<HookValue>
): Root<Props, HookValue>

export function HookRoot<Props extends object | undefined, HookValue>(
  hookFunction: (props: Props) => HookValue,
  initialPropsOrOnUpdate?: Props | OnUpdateFn<HookValue>,
  onUpdate?: OnUpdateFn<HookValue>
): Root<Props, HookValue> {
  let initialProps: Props | undefined = undefined

  if (typeof initialPropsOrOnUpdate === 'function') {
    onUpdate = initialPropsOrOnUpdate as OnUpdateFn<HookValue>
  } else {
    initialProps = initialPropsOrOnUpdate as Props
  }

  // TODO: move props onto state / root
  let renderId = -1
  let needsRender = false
  let needsRenderImmediately = false
  let latestRenderProps: Props

  let valueFresh = false
  let promisedValue: PromisedValue<HookValue> | undefined
  let destroyPromise: Promise<void> | undefined

  const stateRef: State<HookValue> = {
    isSuspended: false,
    get isDestroyed() {
      return Boolean(destroyPromise)
    },
    currentValue: undefined,
    get value() {
      if (valueFresh) {
        return Promise.resolve(stateRef.currentValue!)
      }
      if (!promisedValue) {
        if (stateRef.isDestroyed) {
          return Promise.reject('unavailable | hookRoot already destroyed')
        }
        promisedValue = createPromisedValue<HookValue>()
      }
      return promisedValue.promise
    },
    get effects() {
      return new Promise<void>((resolveEffects, rejectEffects) => {
        stateRef.value
          .then(() => {
            if (isEffectEnvironment) {
              requestAnimationFrame(() => resolveEffects())
            } else {
              setTimeout(resolveEffects)
            }
          })
          .catch(rejectEffects)
      })
    },
  }

  const hookName = hookFunction.name || 'useAnonymousHook'
  const root: Root<Props, HookValue> = Object.freeze({
    displayName: `HookRoot(${hookName})`,
    state: stateRef,
    render,
    update,
    destroy,
  })

  const hook: ActiveHook = {
    displayName: hookName,
    // batches all updates in current tick or flush
    requestRender(immediate) {
      if (immediate && !needsRenderImmediately) {
        needsRenderImmediately = true
      }
      if (needsRender) {
        return
      }
      if (promisedValue && promisedValue.isFulfilled) {
        promisedValue = undefined
      }
      needsRender = true
      valueFresh = false

      if (outerHookState.flushRender) {
        outerHookState.rendersToFlush.add(performRender)
      } else {
        setTimeout(() => Promise.resolve(undefined).then(performRender))
      }
    },
    afterRenderEffects: new Set(),
    afterDestroyEffects: new Set(),
  }

  return render(initialProps!)

  /**
   * re-renders the hook in the next tick, with the new set of props
   * @param nextProps
   */
  function render(nextProps: Props): Root<Props, HookValue> {
    latestRenderProps = nextProps
    hook.requestRender()
    return root
  }

  /**
   * re-renders the hook in the next tick, with the new set of props merged with the previous props
   * @param nextProps
   */
  function update(nextProps?: Partial<Props>): Root<Props, HookValue> {
    return render({ ...latestRenderProps, ...nextProps })
  }

  function destroy(reason?: unknown) {
    if (destroyPromise) {
      __DEV__ && console.error('already destroyed')
      return destroyPromise
    }
    if (promisedValue && !promisedValue.isFulfilled) {
      promisedValue.reject(reason)
    }

    stateRef.currentValue = undefined
    valueFresh = false
    promisedValue = undefined
    destroyPromise = new Promise<void>((resolve) => {
      // flush all already existing destroy effects (also clears still pending effects)
      hook.afterDestroyEffects.forEach((e) => e())
      hook.afterDestroyEffects.clear()

      if (isEffectEnvironment) {
        // again flush destroy effects after animation frame (eg. non-layout effects cleanups)
        requestAnimationFrame(() => {
          hook.afterDestroyEffects.forEach((e) => e())
          hook.afterDestroyEffects.clear()
          resolve()
        })
      } else {
        resolve()
      }
    })

    return destroyPromise
  }

  function performRender(nextProps?: Props): Root<Props, HookValue> {
    if (!needsRender) return root
    if (stateRef.isDestroyed) {
      __DEV__ && console.warn('can not re-render a Hook, that was destroyed.')
      return root
    }

    const { currentHook: prevHook, currentIndex: prevIndex } = outerHookState
    outerHookState.currentHook = hook
    outerHookState.currentIndex = 0

    const thisRenderID = (renderId += 1)
    const renderProps = nextProps ?? latestRenderProps
    let hadError = false

    try {
      stateRef.currentValue = hookFunction(renderProps)
      stateRef.isSuspended = false

      needsRender = false
      valueFresh = true
      latestRenderProps = renderProps

      hook.afterRenderEffects.forEach((e) => e())
      hook.afterRenderEffects.clear()
    } catch (caughtError) {
      hadError = true

      if (
        caughtError instanceof Promise ||
        (caughtError && typeof caughtError.then === 'function')
      ) {
        stateRef.isSuspended = true
        caughtError
          .then(() => renderId === thisRenderID && performRender(nextProps))
          .catch(destroy)
      } else {
        destroy(caughtError)

        if (__DEV__) {
          console.error(caughtError)
        }
      }
    }

    outerHookState.currentHook = prevHook
    outerHookState.currentIndex = prevIndex

    if (hadError) {
      return root
    }

    if (needsRenderImmediately) {
      if (promisedValue && promisedValue.isFulfilled) {
        promisedValue = undefined
      }
      needsRender = true
      valueFresh = false
      needsRenderImmediately = false

      return performRender()
    } else {
      if (onUpdate) {
        onUpdate(stateRef.currentValue!)
      }
      if (promisedValue && !promisedValue.isFulfilled) {
        promisedValue.resolve(stateRef.currentValue!)
      }
      return root
    }
  }
}
