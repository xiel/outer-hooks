const nextTick = () => new Promise((res) => process.nextTick(res))

export const nextRenderWithFakeTimers = async () => {
  jest.runOnlyPendingTimers()
  await nextTick()
}
