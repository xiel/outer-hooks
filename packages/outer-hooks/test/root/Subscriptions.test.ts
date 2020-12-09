import { HookRoot } from '../../src'

describe('subscriptions', () => {
  it('should call subscription func after render (no props)', async () => {
    let renderId = -1
    const onUpdateFn = jest.fn()
    const hookRoot = HookRoot(() => {
      renderId++
      return `value: ${renderId}`
    })

    hookRoot.subscribe(onUpdateFn)

    expect(await hookRoot.state.value).toEqual('value: 0')
    expect(onUpdateFn).toHaveBeenCalledTimes(1)
    expect(onUpdateFn).toHaveBeenLastCalledWith('value: 0')
    await hookRoot.update().state.value
    expect(onUpdateFn).toHaveBeenCalledTimes(2)
    expect(onUpdateFn).toHaveBeenLastCalledWith('value: 1')
  })

  it('should call subscription func after render (empty props)', async () => {
    let renderId = -1
    const onUpdateFn = jest.fn()
    const hookRoot = HookRoot(() => {
      renderId++
      return `value: ${renderId}`
    }, {})

    hookRoot.subscribe(onUpdateFn)

    await hookRoot.state.value
    expect(onUpdateFn).toHaveBeenCalledTimes(1)
    expect(onUpdateFn).toHaveBeenLastCalledWith('value: 0')
    await hookRoot.update().state.value
    expect(onUpdateFn).toHaveBeenCalledTimes(2)
    expect(onUpdateFn).toHaveBeenLastCalledWith('value: 1')
  })
})
