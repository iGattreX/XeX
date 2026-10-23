import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Tooltip, placeAtPointer, placeTooltip } from '../src'

const rect = (left: number, top: number, width = 40, height = 24) =>
  ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect
const view = { width: 1000, height: 700 }
const size = { width: 160, height: 28 }
const inside = (s: { left: number; top: number }) => s.left >= 8 && s.top >= 8 && s.left + size.width <= view.width - 8 && s.top + size.height <= view.height - 8

describe('placeTooltip: always inside the screen', () => {
  it('uses the preferred side when it fits', () => {
    const s = placeTooltip(rect(480, 300), size, view, 'top')
    expect(s.top).toBe(300 - 6 - 28) // above, with the gap
    expect(inside(s)).toBe(true)
  })

  it('flips to the opposite side when the preferred one has no room', () => {
    expect(placeTooltip(rect(480, 10), size, view, 'top').top).toBeGreaterThan(10) // no room above: below
    expect(placeTooltip(rect(480, 680), size, view, 'bottom').top).toBeLessThan(680) // no room below: above
    expect(placeTooltip(rect(20, 300), size, view, 'left').left).toBeGreaterThan(20) // no room left: right
    expect(placeTooltip(rect(950, 300), size, view, 'right').left).toBeLessThan(950) // no room right: left
  })

  it('slides along the edge: never past any side, at every corner and for every preference', () => {
    const corners = [rect(0, 0), rect(960, 0), rect(0, 676), rect(960, 676), rect(480, 0), rect(0, 350), rect(960, 350), rect(480, 676)]
    for (const target of corners) {
      for (const preferred of ['top', 'bottom', 'left', 'right'] as const) {
        expect(inside(placeTooltip(target, size, view, preferred)), `${target.left},${target.top} ${preferred}`).toBe(true)
      }
    }
  })

  it('still fits when there is little room anywhere (a small screen)', () => {
    const tiny = { width: 200, height: 120 }
    const s = placeTooltip(rect(80, 50), { width: 180, height: 28 }, tiny, 'right')
    expect(s.left).toBeGreaterThanOrEqual(8)
    expect(s.left + 180).toBeLessThanOrEqual(192)
  })
})

describe('placeAtPointer: below the pointer, on screen', () => {
  it('opens below and a little to the right of the pointer, so the cursor does not cover it', () => {
    const s = placeAtPointer({ x: 300, y: 200 }, size, view)
    expect(s).toEqual({ left: 314, top: 224 })
    expect(s.left).toBeGreaterThan(300 + 12) // past the cursor's width
    expect(s.top).toBeGreaterThan(200 + 22) // below the cursor's height (a hand is taller than an arrow)
  })

  it('goes above the pointer when there is no room below', () => {
    const s = placeAtPointer({ x: 300, y: 690 }, size, view)
    expect(s.top).toBeLessThan(690)
    expect(inside(s)).toBe(true)
  })

  it('is clamped at every corner', () => {
    for (const p of [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 0, y: 700 }, { x: 1000, y: 700 }, { x: 500, y: 350 }]) {
      expect(inside(placeAtPointer(p, size, view)), `${p.x},${p.y}`).toBe(true)
    }
  })
})

describe('Tooltip', () => {
  it('describes its control for screen readers whether or not it is showing, and is hidden until needed', () => {
    render(
      <Tooltip content="Save your work">
        <button>Save</button>
      </Tooltip>,
    )
    const button = screen.getByRole('button', { name: 'Save' })
    const tip = document.getElementById(button.getAttribute('aria-describedby')!)!
    expect(tip).toHaveAttribute('role', 'tooltip')
    expect(tip).toHaveTextContent('Save your work')
    expect(tip).toHaveAttribute('hidden')
    expect(button).toHaveAccessibleDescription('Save your work')
  })

  it('opens on hover after the delay and closes when the pointer leaves', async () => {
    render(
      <Tooltip content="Hello" delay={0}>
        <button>Go</button>
      </Tooltip>,
    )
    await userEvent.hover(screen.getByRole('button', { name: 'Go' }))
    expect(await screen.findByRole('tooltip')).toBeVisible()
    await userEvent.unhover(screen.getByRole('button', { name: 'Go' }))
    await act(() => new Promise((r) => setTimeout(r, 150)))
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute('hidden')
  })

  it('Escape closes it', async () => {
    render(
      <Tooltip content="Hello" delay={0}>
        <button>Go</button>
      </Tooltip>,
    )
    await userEvent.hover(screen.getByRole('button', { name: 'Go' }))
    expect(await screen.findByRole('tooltip')).toBeVisible()
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute('hidden')
  })

  it('renders only its child when disabled', () => {
    render(
      <Tooltip content="Hello" disabled>
        <button>Go</button>
      </Tooltip>,
    )
    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go' })).not.toHaveAttribute('aria-describedby')
  })
})
