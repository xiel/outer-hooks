export type Effect = () => void

export interface ActiveHook {
  displayName: string
  requestRender(): void
  afterRenderEffects: Set<Effect>
  afterDestroyEffects: Set<Effect>
}

export interface OuterHookState {
  currentHook?: ActiveHook
  currentIndex: number
}

export const outerHookState: OuterHookState = {
  currentHook: undefined,
  currentIndex: -1,
}
