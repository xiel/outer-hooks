export type RenderFn<Props, HookValue> = (
  nextProps: Props
) => Root<Props, HookValue>

export type UpdateFn<Props, HookValue> = (
  partialNextProps?: Partial<Props>
) => Root<Props, HookValue>

export type Subscription<V> = (value: V) => void

export type SubscriptionTypes<HookValue = unknown> = {
  update: Subscription<HookValue>
  destroy: Subscription<unknown>
}

type UnsubscribeFn = () => void

// TODO: Idea, make Root PromiseLike, alias to value promise
export interface Root<Props, HookValue> {
  displayName: string

  /**
   * Resolves once the hooks has rendered.
   * Might resolve after being intermediately suspended.
   */
  value: Promise<HookValue>

  /**
   * Resolves once all side effects have run (cleanups, useLayoutEffects and useEffects)
   */
  effects: Promise<void>

  /**
   * Returns the current value of the ran hook (outermost custom `useXYZ` hook)
   * This might return undefined or a stole/older value while the hook is suspended.
   * Recommended: Use the value promise to get the latest value.
   */
  currentValue?: HookValue

  /**
   * While the hook is suspended, this will return true
   */
  isSuspended: boolean

  /**
   * If the hook was destroyed (by error or externally), this will return true
   */
  isDestroyed: boolean

  /**
   * Resolves after all cleanup functions have run
   */
  isDestroyedPromise: Promise<unknown> | undefined

  /**
   * Re-run the hook with new props
   */
  render: RenderFn<Props, HookValue>

  /**
   * Re-run the hook with (partially) new props.
   */
  update: UpdateFn<Props, HookValue>

  /**
   * Subscribe to hook updates
   */
  on: <T extends keyof SubscriptionTypes>(
    type: T,
    subscription: SubscriptionTypes<HookValue>[T]
  ) => UnsubscribeFn

  /**
   * Unsubscribe from hook updates
   */
  off: <T extends keyof SubscriptionTypes>(
    type: T,
    subscription: SubscriptionTypes<HookValue>[T]
  ) => void

  /**
   * Destroy the hook.
   * This will run all cleanup functions and reject the value promise
   */
  destroy(reason?: unknown): Promise<unknown>
}
