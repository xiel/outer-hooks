import { __DEV__, isEffectEnvironment } from '../core/env'
import { ActiveHook, callEffect, outerHookState } from '../core/OuterHookState'
import {
  createPromisedValue,
  isPromiseLike,
  PromisedValue,
} from '../core/promisedValue'
import {
  Root,
  Subscription,
  SubscriptionTypes as _SubscriptionTypes,
} from './HookRootTypes'

export function HookRoot<Props extends {} | undefined, HookValue>(
  hookFunction: (props: Props) => HookValue,
  initialProps: Props
): Root<Props, HookValue>

export function HookRoot<Props extends {} | undefined, HookValue>(
  hookFunction: (props?: Props) => HookValue
): Root<Props, HookValue>

export function HookRoot<Props extends {}, HookValue>(
  hookFunction: (props: Props) => HookValue,
  initialProps?: Props
): Root<Props, HookValue> {
  type SubscriptionTypes = _SubscriptionTypes<HookValue>

  // TODO: move props onto state / hookRoot
  let renderId = -1
  let needsRender = true
  let needsRenderImmediately = false
  let latestRenderProps: Props
  let isSuspended = false
  let valueFresh = false
  let currentValue: HookValue | undefined = undefined
  let promisedValue: PromisedValue<HookValue> | undefined
  let isDestroyedPromise: Promise<unknown> | undefined

  const subscriptions = {
    update: new Set<Subscription<HookValue>>(),
    destroy: new Set<Subscription<unknown>>(),
  }

  const hookName = hookFunction.name || 'useAnonymousHook'
  const hookRoot: Root<Props, HookValue> = Object.freeze({
    displayName: `HookRoot(${hookName})`,
    get isSuspended() {
      return isSuspended
    },
    get currentValue() {
      return currentValue
    },
    get isDestroyed() {
      return Boolean(isDestroyedPromise)
    },
    get isDestroyedPromise() {
      return isDestroyedPromise
    },
    get value() {
      if (valueFresh) {
        return Promise.resolve(currentValue!)
      }
      if (!promisedValue) {
        promisedValue = createPromisedValue<HookValue>()

        if (hookRoot.isDestroyed) {
          isDestroyedPromise!.then((reason) =>
            promisedValue!.reject(
              reason || Error('not available | hookRoot is destroyed')
            )
          )
        }
      }
      return promisedValue.promise
    },
    get effects() {
      return new Promise<void>((resolveEffects, rejectEffects) => {
        hookRoot.value
          .then(() => {
            const checkDestroyPromise = () =>
              isDestroyedPromise
                ? rejectEffects(isDestroyedPromise)
                : resolveEffects()

            if (isEffectEnvironment) {
              requestAnimationFrame(checkDestroyPromise)
            } else {
              setTimeout(checkDestroyPromise)
            }
          })
          .catch(rejectEffects)
      })
    },
    render,
    update,
    destroy,
    on,
    off,
  })

  const hook: ActiveHook<Props, HookValue> = {
    hookRoot,
    // batches all updates in next microtask
    requestRender(immediate) {
      if (immediate) {
        needsRenderImmediately = true
      }

      updateRenderStatesBeforePerformRender()

      if (outerHookState.flushRender) {
        outerHookState.rendersToFlush.add(performRender)
      } else {
        // batch all updates into next micro task execution
        Promise.resolve(undefined).then(performRender)
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

  function on<T extends keyof SubscriptionTypes>(
    type: T,
    subscription: SubscriptionTypes[T]
  ) {
    subscriptions[type].add(subscription as Subscription<any>)
    return () => off(type, subscription)
  }

  function off<T extends keyof SubscriptionTypes>(
    type: T,
    subscription: SubscriptionTypes[T]
  ) {
    if (
      __DEV__ &&
      !subscriptions[type].has(subscription as Subscription<any>)
    ) {
      console.error('subscription unknown')
    }
    subscriptions[type].delete(subscription as Subscription<any>)
  }

  function destroy(reason?: unknown) {
    if (isDestroyedPromise) {
      __DEV__ && console.error('already destroyed')
      return isDestroyedPromise
    }
    if (promisedValue && !promisedValue.isSettled) {
      promisedValue.reject(reason)
    }

    if (__DEV__ && reason) {
      console.error(`${hookName} was destroyed due to`, reason)
    }

    currentValue = undefined
    valueFresh = false
    promisedValue = undefined
    isDestroyedPromise = new Promise<unknown>((resolve) => {
      // flush all already existing destroy effects (also clears still pending effects)
      hook.afterDestroyEffects.forEach(callEffect)
      hook.afterDestroyEffects.clear()

      if (isEffectEnvironment) {
        // again flush destroy effects after animation frame (eg. non-layout effects cleanups)
        requestAnimationFrame(() => {
          hook.afterDestroyEffects.forEach(callEffect)
          hook.afterDestroyEffects.clear()
          notifyDestroySubscriptions(reason)
          resolve(reason!)
        })
      } else {
        notifyDestroySubscriptions(reason)
        resolve(reason!)
      }
    })

    return isDestroyedPromise
  }

  function notifyDestroySubscriptions(reason?: unknown) {
    Promise.resolve().then(() => {
      subscriptions.destroy.forEach((subscription) => subscription(reason))
    })
  }

  function updateRenderStatesBeforePerformRender() {
    if (promisedValue && promisedValue.isSettled) {
      promisedValue = undefined
    }
    needsRender = true
    valueFresh = false
  }

  function performRender(nextProps?: Props): Root<Props, HookValue> {
    if (!needsRender) return hookRoot
    if (hookRoot.isDestroyed) {
      __DEV__ &&
        console.warn(
          `${hookRoot.displayName}: can not re-render a Hook, that was destroyed.`
        )
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

      currentValue = hookFunction(renderProps)
      isSuspended = false

      valueFresh = true
      latestRenderProps = renderProps

      hook.afterRenderEffects.forEach(callEffect)
      hook.afterRenderEffects.clear()
    } catch (caughtError) {
      hadError = true

      if (isPromiseLike(caughtError)) {
        needsRender = true
        isSuspended = true

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

    // state updates are triggered from render will be rendered in sync
    if (needsRenderImmediately) {
      updateRenderStatesBeforePerformRender()
      return performRender()
    } else {
      const freshValue = currentValue!

      Promise.resolve().then(() => {
        subscriptions.update.forEach((subscription) => subscription(freshValue))
      })

      if (promisedValue && !promisedValue.isSettled) {
        promisedValue.resolve(currentValue!)
      }
      return hookRoot
    }
  }
}
