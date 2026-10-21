import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Section } from '../src'

const section = () => document.getElementById('billing')!
const look = () => ({ card: section().className.includes('card'), padding: /\bp-6\b/.test(section().className) })

describe('Section', () => {
  it('is a bordered card with padding by default', () => {
    render(<Section id="billing" title="Billing">content</Section>)
    expect(look()).toEqual({ card: true, padding: true })
    expect(section()).toHaveAttribute('data-appearance', 'card')
  })

  it('appearance="plain" has no card (border, background, shadow) but keeps the heading', () => {
    render(<Section id="billing" title="Billing" description="Plans and invoices" appearance="plain">content</Section>)
    expect(section().className).not.toContain('card')
    expect(screen.getByRole('heading', { name: 'Billing' })).toBeInTheDocument()
    expect(screen.getByText('Plans and invoices')).toBeInTheDocument()
  })

  it('a card is always padded, even with padded={false}; a plain Section can drop its padding', () => {
    const { rerender } = render(<Section id="billing" title="Billing">content</Section>)
    expect(look()).toEqual({ card: true, padding: true })
    rerender(<Section id="billing" title="Billing" padded={false}>content</Section>)
    expect(look()).toEqual({ card: true, padding: true })
    rerender(<Section id="billing" title="Billing" appearance="plain">content</Section>)
    expect(look()).toEqual({ card: false, padding: true })
    rerender(<Section id="billing" title="Billing" appearance="plain" padded={false}>content</Section>)
    expect(look()).toEqual({ card: false, padding: false })
  })
})
