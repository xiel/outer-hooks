export interface State<HookValue> {
  value: HookValue
  isSuspended: boolean
  isDestroyed: boolean
}

export type UpdateFn<Props, HookValue> = (
  nextProps: Props
) => Root<Props, HookValue>

export interface Root<Props, HookValue> {
  state: State<HookValue>
  update: UpdateFn<Props, HookValue>
  updatePartial: (partialNextProps: Partial<Props>) => Root<Props, HookValue>
  destroy(): void
}
