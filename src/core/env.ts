export const __DEV__ = process.env.NODE_ENV !== 'production'

const {
  requestAnimationFrame,
  setImmediate,
  setTimeout,
  cancelAnimationFrame,
  clearImmediate,
  clearTimeout,
} = global

export const scheduleEffect =
  requestAnimationFrame || setImmediate || setTimeout

export const cancelEffect =
  cancelAnimationFrame || clearImmediate || clearTimeout
