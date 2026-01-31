import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import Navigation from '../Navigation'

describe('Navigation', () => {
  it('renders navigation links', () => {
    render(<Navigation />)
    // Should have key nav items
    expect(screen.getByText(/MEN IN THE ARENA/i)).toBeInTheDocument()
  })
})
