import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import Hero from '../Hero'

describe('Hero', () => {
  it('renders the main heading', () => {
    render(<Hero />)
    expect(screen.getByText('MEN IN THE ARENA')).toBeInTheDocument()
  })

  it('renders CTA buttons', () => {
    render(<Hero />)
    expect(screen.getByText('Enter the Arena')).toBeInTheDocument()
    expect(screen.getByText('Our Mission')).toBeInTheDocument()
  })

  it('renders the tagline', () => {
    render(<Hero />)
    expect(screen.getByText(/Stop walking through life alone/)).toBeInTheDocument()
  })
})
