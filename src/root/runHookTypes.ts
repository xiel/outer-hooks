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
  currentValue?: HookValue

  /**
   * Resolves with the HookValue, once the hooks has rendered.
   * Might resolve after being intermediately suspended.
   */
  value: Promise<HookValue>

  /**
   * Resolves once all side effects have run (cleanups, useLayoutEffects and useEffects)
   */
  effects: Promise<void>

  isSuspended: boolean
  isDestroyed: boolean
  isDestroyedPromise: Promise<unknown> | undefined
  render: RenderFn<Props, HookValue>
  update: UpdateFn<Props, HookValue>
  on: <T extends keyof SubscriptionTypes>(
    type: T,
    subscription: SubscriptionTypes<HookValue>[T]
  ) => UnsubscribeFn
  off: <T extends keyof SubscriptionTypes>(
    type: T,
    subscription: SubscriptionTypes<HookValue>[T]
  ) => void
  destroy(reason?: unknown): Promise<unknown>
}
