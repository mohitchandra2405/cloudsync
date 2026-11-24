import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login.jsx'
import Register from './Register.jsx'

const authService = vi.hoisted(() => ({
  loginUser: vi.fn(), loginWithGoogle: vi.fn(), resetPassword: vi.fn(), registerUser: vi.fn(),
}))
const firebaseConfig = vi.hoisted(() => ({ isFirebaseConfigured: true }))
vi.mock('../services/authService.js', () => authService)
vi.mock('../services/firebase.js', () => firebaseConfig)

afterEach(() => { cleanup(); vi.clearAllMocks(); firebaseConfig.isFirebaseConfigured = true })

describe('authentication screens', () => {
  it('explains that registration is unavailable until Firebase is configured', () => {
    firebaseConfig.isFirebaseConfigured = false
    render(<MemoryRouter><Register /></MemoryRouter>)
    expect(screen.getByRole('alert')).toHaveTextContent('Firebase is not connected')
    expect(screen.getByRole('button', { name: 'Configure Firebase to create account' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Google sign-up unavailable until setup' })).toBeDisabled()
    expect(authService.registerUser).not.toHaveBeenCalled()
  })

  it('submits the sign-in form with the entered credentials', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><Login /></MemoryRouter>)
    await user.type(screen.getByLabelText('Email address'), 'person@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret-pass')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(authService.loginUser).toHaveBeenCalledWith('person@example.com', 'secret-pass'))
  })

  it('shows a clear error when password confirmation does not match', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><Register /></MemoryRouter>)
    await user.type(screen.getByLabelText('Full name'), 'Casey Example')
    await user.type(screen.getByLabelText('Email address'), 'casey@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret-pass')
    await user.type(screen.getByLabelText('Confirm password'), 'different-pass')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Your passwords do not match.')
    expect(authService.registerUser).not.toHaveBeenCalled()
  })

  it('sends a password reset for the entered address', async () => {
    const user = userEvent.setup()
    authService.resetPassword.mockResolvedValueOnce(undefined)
    render(<MemoryRouter><Login /></MemoryRouter>)
    await user.type(screen.getByLabelText('Email address'), 'person@example.com')
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }))
    await waitFor(() => expect(authService.resetPassword).toHaveBeenCalledWith('person@example.com'))
    expect(await screen.findByText('Password reset email sent. Check your inbox.')).toBeInTheDocument()
  })
})
