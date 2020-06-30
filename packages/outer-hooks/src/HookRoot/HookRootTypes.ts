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
  // TODO: rename to (re-)render (full props)
  update: UpdateFn<Props, HookValue>
  // TODO: rename to update (partial props)
  updatePartial: (partialNextProps: Partial<Props>) => Root<Props, HookValue>
  destroy(): void
}
