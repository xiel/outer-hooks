export const __DEV__ = process.env.NODE_ENV !== 'production'

export const isEffectEnvironment = Boolean(
  global?.window?.document?.documentElement && requestAnimationFrame
)
