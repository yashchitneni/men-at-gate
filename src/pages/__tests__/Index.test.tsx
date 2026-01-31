import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import Index from '../Index'

describe('Index Page', () => {
  it('renders without crashing', () => {
    render(<Index />)
    expect(screen.getByText('MEN IN THE ARENA')).toBeInTheDocument()
  })

  it('renders all major sections', () => {
    render(<Index />)
    expect(screen.getByText('OUR PILLARS')).toBeInTheDocument()
    expect(screen.getByText('Our Story')).toBeInTheDocument()
    expect(screen.getByText('Get Involved')).toBeInTheDocument()
  })
})
