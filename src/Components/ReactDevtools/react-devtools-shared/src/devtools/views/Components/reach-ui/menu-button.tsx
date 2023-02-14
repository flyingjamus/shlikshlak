import * as React from 'react'
import { Menu, MenuList as ReachMenuList, MenuButton, MenuItem } from '@reach/menu-button'

const MenuList = ({ children, ...props }: { children: React.ReactNode }) => {
  return <ReachMenuList {...props}>{children}</ReachMenuList>
}

export { MenuItem, MenuButton, MenuList, Menu }
