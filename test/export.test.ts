import * as ExportedInterface from '../src'

test('exported interface', () => {
  expect(ExportedInterface).toMatchInlineSnapshot(`
    Object {
      "HookRoot": [Function],
      "act": [Function],
      "useCallback": [Function],
      "useEffect": [Function],
      "useLayoutEffect": [Function],
      "useMemo": [Function],
      "useReducer": [Function],
      "useRef": [Function],
      "useState": [Function],
    }
  `)
})