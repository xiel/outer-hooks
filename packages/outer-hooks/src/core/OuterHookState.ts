import { Root } from '../root/HookRootTypes'

export type Effect = () => void
export type FlushableRenderFn = () => unknown

export interface ActiveHook<Props = unknown, HookValue = unknown> {
  hookRoot: Root<Props, HookValue>
  requestRender(immediate?: boolean): void
  afterRenderEffects: Set<Effect>
  afterDestroyEffects: Set<Effect>
}

export interface OuterHookState {
  currentHook?: ActiveHook
  currentIndex: number
  flushRender: boolean
  rendersToFlush: Set<FlushableRenderFn>
}

export const outerHookState: OuterHookState = {
  currentHook: undefined,
  currentIndex: -1,
  flushRender: false,
  rendersToFlush: new Set(),
}
