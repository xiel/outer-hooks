export interface State<HookValue> {
  value: HookValue
  isSuspended: boolean
  isDestroyed: boolean
}

export type RenderFn<Props, HookValue> = (
  nextProps: Props
) => Root<Props, HookValue>

export type UpdateFn<Props, HookValue> = (
  partialNextProps: Partial<Props>
) => Root<Props, HookValue>

export interface Root<Props, HookValue> {
  displayName: string
  state: State<HookValue>
  render: RenderFn<Props, HookValue>
  update: UpdateFn<Props, HookValue>
  destroy(): void
}
