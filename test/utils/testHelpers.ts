export const nextTick = () => new Promise((res) => process.nextTick(res))

export const nextRenderWithFakeTimers = async () => {
  jest.runOnlyPendingTimers()
  await nextTick()
}

export const nextMicrotask = () => Promise.resolve()

export const silenceNextConsoleError = () => {
  jest.spyOn(console, 'error').mockImplementationOnce(jest.fn)
}
