import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

test('the test harness renders and queries the DOM', () => {
    render(<h1>Hello</h1>)
    expect(screen.getByRole('heading', { name: 'Hello' })).toBeInTheDocument()
})