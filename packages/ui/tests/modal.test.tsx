import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { Button, ConfirmDialog, Modal } from '../src'

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Settings" footer={<Button>Save</Button>}>
        <input aria-label="Name" />
      </Modal>
    </>
  )
}

describe('Modal', () => {
  it('is named by its title and moves focus to the first field', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByText('Open'))
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByLabelText('Name')).toHaveFocus()
  })

  it('traps Tab inside the dialog', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByText('Open'))
    // Name -> Save (footer) -> wraps to Close (header)
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus()
  })

  it('closes on Escape and hands focus back to the opener', async () => {
    render(<Harness />)
    const opener = screen.getByText('Open')
    await userEvent.click(opener)
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opener).toHaveFocus()
  })

  it('locks page scroll while open and restores it', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByText('Open'))
    expect(document.body.style.overflow).toBe('hidden')
    await userEvent.keyboard('{Escape}')
    expect(document.body.style.overflow).toBe('')
  })
})

describe('ConfirmDialog', () => {
  it('starts on Cancel so Enter cannot delete by accident', () => {
    render(<ConfirmDialog open title="Delete project?" message="This cannot be undone." onConfirm={() => {}} onCancel={() => {}} />)
    expect(screen.getByRole('dialog', { name: 'Delete project?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })
})
