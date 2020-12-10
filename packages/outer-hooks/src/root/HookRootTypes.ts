export type RenderFn<Props, HookValue> = (
  nextProps: Props
) => Root<Props, HookValue>

export type UpdateFn<Props, HookValue> = (
  partialNextProps?: Partial<Props>
) => Root<Props, HookValue>

export type Subscription<HookValue> = (value: HookValue) => void

type UnsubscribeFn = () => void

export interface Root<Props, HookValue> {
  displayName: string
  currentValue?: HookValue
  value: Promise<HookValue>
  effects: Promise<void>
  isSuspended: boolean
  isDestroyed: boolean
  render: RenderFn<Props, HookValue>
  update: UpdateFn<Props, HookValue>
  subscribe: (subscription: Subscription<HookValue>) => UnsubscribeFn
  unsubscribe: (subscription: Subscription<HookValue>) => void
  destroy(reason?: unknown): Promise<void>
}
