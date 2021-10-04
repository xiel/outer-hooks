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

export interface Root<Props, HookValue> {
  displayName: string
  currentValue?: HookValue
  value: Promise<HookValue>
  effects: Promise<void>
  isSuspended: boolean
  isDestroyed: boolean
  isDestroyedPromise: Promise<unknown> | undefined
  render: RenderFn<Props, HookValue>
  update: UpdateFn<Props, HookValue>
  subscribe: (subscription: Subscription<HookValue>) => UnsubscribeFn
  unsubscribe: (subscription: Subscription<HookValue>) => void
  on: <T extends keyof SubscriptionTypes>(
    type: T,
    subscription: SubscriptionTypes[T]
  ) => UnsubscribeFn
  off: <T extends keyof SubscriptionTypes>(
    type: T,
    subscription: SubscriptionTypes[T]
  ) => void
  destroy(reason?: unknown): Promise<unknown>
}
