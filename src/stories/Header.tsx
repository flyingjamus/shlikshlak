import React from 'react'

import Button from '@mui/material/Button'
import './header.css'

type User = {
  name: string
}

interface HeaderProps {
  user?: User
  onLogin: () => void
  onLogout: () => void
  onCreateAccount: () => void
}

export const Header = ({ user, onLogin, ...props }: HeaderProps) => (
  <Button size={"large"} onClick={onLogin} color={"inherit"}  />
)
