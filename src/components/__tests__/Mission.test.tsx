import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import Mission from '../Mission'

describe('Mission / Pillars', () => {
  it('renders all four pillars', () => {
    render(<Mission />)
    expect(screen.getByText('Challenge')).toBeInTheDocument()
    expect(screen.getByText('Fellowship')).toBeInTheDocument()
    expect(screen.getByText('Duty')).toBeInTheDocument()
    expect(screen.getByText('Reflection')).toBeInTheDocument()
  })

  it('renders the section heading', () => {
    render(<Mission />)
    expect(screen.getByText('OUR PILLARS')).toBeInTheDocument()
  })
})
