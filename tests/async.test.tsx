import React, { StrictMode, Suspense } from 'react'
import { fireEvent, render } from '@testing-library/react'
import { proxy, useSnapshot } from '../src/index'

const consoleError = console.error
beforeEach(() => {
  console.error = jest.fn((message) => {
    if (
      process.env.NODE_ENV === 'production' &&
      message.startsWith('act(...) is not supported in production')
    ) {
      return
    }
    consoleError(message)
  })
})
afterEach(() => {
  console.error = consoleError
})

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

it('delayed increment', async () => {
  const state = proxy<any>({ count: 0 })
  const delayedIncrement = () => {
    const nextCount = state.count + 1
    state.count = sleep(10).then(() => nextCount)
  }

  const Counter: React.FC = () => {
    const snap = useSnapshot(state)
    return (
      <>
        <div>count: {snap.count}</div>
        <button onClick={delayedIncrement}>button</button>
      </>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
    </StrictMode>
  )

  await findByText('count: 0')

  fireEvent.click(getByText('button'))
  await findByText('loading')
  await findByText('count: 1')
})

it('delayed object', async () => {
  const state = proxy<any>({ object: { text: 'none' } })
  const delayedObject = () => {
    state.object = sleep(10).then(() => ({ text: 'hello' }))
  }

  const Counter: React.FC = () => {
    const snap = useSnapshot(state)
    return (
      <>
        <div>text: {snap.object.text}</div>
        <button onClick={delayedObject}>button</button>
      </>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
    </StrictMode>
  )

  await findByText('text: none')

  fireEvent.click(getByText('button'))
  await findByText('loading')
  await findByText('text: hello')
})

it('delayed object update fullfilled', async () => {
  const state = proxy<any>({
    object: sleep(10).then(() => ({ text: 'counter', count: 0 })),
  })
  const updateObject = () => {
    state.object = state.object.then((v: any) => ({ ...v, count: v.count + 1 }))
  }

  const Counter: React.FC = () => {
    const snap = useSnapshot(state)
    return (
      <>
        <div>text: {snap.object.text}</div>
        <div>count: {snap.object.count}</div>
        <button onClick={updateObject}>button</button>
      </>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
    </StrictMode>
  )

  await findByText('loading')
  await findByText('text: counter')
  await findByText('count: 0')

  fireEvent.click(getByText('button'))

  await findByText('loading')
  await findByText('text: counter')
  await findByText('count: 1')
})

it('delayed falsy value', async () => {
  const state = proxy<any>({ value: true })
  const delayedValue = () => {
    state.value = sleep(10).then(() => null)
  }

  const Counter: React.FC = () => {
    const snap = useSnapshot(state)
    return (
      <>
        <div>value: {String(snap.value)}</div>
        <button onClick={delayedValue}>button</button>
      </>
    )
  }

  const { getByText, findByText } = render(
    <StrictMode>
      <Suspense fallback="loading">
        <Counter />
      </Suspense>
    </StrictMode>
  )

  await findByText('value: true')

  fireEvent.click(getByText('button'))
  await findByText('loading')
  await findByText('value: null')
})
