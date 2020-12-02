import { __DEV__, isEffectEnvironment } from '../core/env'
import { ActiveHook, callEffect, outerHookState } from '../core/OuterHookState'
import { createPromisedValue, PromisedValue } from '../core/promisedValue'
import { Root, State, Subscription } from './HookRootTypes'

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

  // TODO: move props onto state / hookRoot
  let renderId = -1
  let needsRender = true
  let needsRenderImmediately = false
  let latestRenderProps: Props

  let valueFresh = false
  let promisedValue: PromisedValue<HookValue> | undefined
  let destroyPromise: Promise<void> | undefined
  const subscriptions = new Set<Subscription<HookValue>>()

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
          return Promise.reject('not available | hookRoot is destroyed')
        }
        promisedValue = createPromisedValue<HookValue>()
      }
      return promisedValue.promise
    },
    get effects() {
      return new Promise<void>((resolveEffects, rejectEffects) => {
        stateRef.value
          .then(() => {
            const checkDestroyPromise = () =>
              destroyPromise ? rejectEffects(destroyPromise) : resolveEffects()

            if (isEffectEnvironment) {
              requestAnimationFrame(checkDestroyPromise)
            } else {
              setTimeout(checkDestroyPromise)
            }
          })
          .catch(rejectEffects)
      })
    },
  }

  const hookName = hookFunction.name || 'useAnonymousHook'
  const hookRoot: Root<Props, HookValue> = Object.freeze({
    displayName: `HookRoot(${hookName})`,
    state: stateRef,
    render,
    update,
    destroy,
    subscribe,
    unsubscribe,
  })

  const hook: ActiveHook<Props, HookValue> = {
    hookRoot,
    // batches all updates in current tick or flush
    requestRender(immediate) {
      if (immediate && !needsRenderImmediately) {
        needsRenderImmediately = true
      }
      if (promisedValue && promisedValue.isSettled) {
        promisedValue = undefined
      }
      needsRender = true
      valueFresh = false

      if (outerHookState.flushRender) {
        outerHookState.rendersToFlush.add(performRender)
      } else if (immediate) {
        Promise.resolve(undefined).then(performRender)
      } else {
        console.log('slow perform render requested...')
        setTimeout(performRender)
      }
    },
    afterRenderEffects: new Set(),
    afterDestroyEffects: new Set(),
  }

  return performRender(initialProps)

  /**
   * re-renders the hook in the next tick, with the new set of props
   * @param nextProps
   */
  function render(nextProps: Props): Root<Props, HookValue> {
    latestRenderProps = nextProps
    hook.requestRender()
    return hookRoot
  }

  /**
   * re-renders the hook in the next tick, with the new set of props merged with the previous props
   * @param nextProps
   */
  function update(nextProps?: Partial<Props>): Root<Props, HookValue> {
    return render({ ...latestRenderProps, ...nextProps })
  }

  function subscribe(subscription: Subscription<HookValue>) {
    subscriptions.add(subscription)
    return () => unsubscribe(subscription)
  }

  function unsubscribe(subscription: Subscription<HookValue>) {
    if (__DEV__ && !subscriptions.has(subscription)) {
      console.error('subscription unknown')
    }
    subscriptions.delete(subscription)
  }

  function destroy(reason?: unknown) {
    if (destroyPromise) {
      __DEV__ && console.error('already destroyed')
      return destroyPromise
    }
    if (promisedValue && !promisedValue.isSettled) {
      promisedValue.reject(reason)
    }
    if (__DEV__ && reason) {
      console.error(`${hookName} was destroyed due to`, reason)
    }

    stateRef.currentValue = undefined
    valueFresh = false
    promisedValue = undefined
    destroyPromise = new Promise<void>((resolve) => {
      // flush all already existing destroy effects (also clears still pending effects)
      hook.afterDestroyEffects.forEach(callEffect)
      hook.afterDestroyEffects.clear()

      if (isEffectEnvironment) {
        // again flush destroy effects after animation frame (eg. non-layout effects cleanups)
        requestAnimationFrame(() => {
          hook.afterDestroyEffects.forEach(callEffect)
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
    if (!needsRender) return hookRoot
    if (stateRef.isDestroyed) {
      __DEV__ && console.warn('can not re-render a Hook, that was destroyed.')
      return hookRoot
    }

    const { currentHook: prevHook, currentIndex: prevIndex } = outerHookState

    outerHookState.currentHook = hook as ActiveHook
    outerHookState.currentIndex = 0

    const thisRenderID = (renderId += 1)
    const renderProps = nextProps ?? latestRenderProps
    let hadError = false

    try {
      needsRender = false
      needsRenderImmediately = false

      stateRef.currentValue = hookFunction(renderProps)
      stateRef.isSuspended = false

      valueFresh = true
      latestRenderProps = renderProps

      hook.afterRenderEffects.forEach(callEffect)
      hook.afterRenderEffects.clear()
    } catch (e) {
      let caughtError: Error | PromiseLike<unknown> = e

      hadError = true

      if (
        (caughtError && caughtError instanceof Promise) ||
        ('then' in caughtError && typeof caughtError.then === 'function')
      ) {
        needsRender = true
        stateRef.isSuspended = true

        caughtError.then(
          () => renderId === thisRenderID && performRender(nextProps),
          destroy
        )
      } else {
        destroy(caughtError)
      }
    }

    outerHookState.currentHook = prevHook
    outerHookState.currentIndex = prevIndex

    if (hadError) {
      return hookRoot
    }

    if (needsRenderImmediately) {
      if (promisedValue && promisedValue.isSettled) {
        promisedValue = undefined
      }
      needsRender = true
      valueFresh = false
      needsRenderImmediately = false

      return performRender()
    } else {
      subscriptions.forEach((subscription) =>
        subscription(stateRef.currentValue!)
      )

      if (onUpdate) {
        onUpdate(stateRef.currentValue!)
      }
      if (promisedValue && !promisedValue.isSettled) {
        promisedValue.resolve(stateRef.currentValue!)
      }
      return hookRoot
    }
  }
}
