import * as React from 'react'
import ReachTooltip from '@reach/tooltip'
import tooltipStyles from './Tooltip.module.css'

const Tooltip = ({
  children,
  className = '',
  ...props
}: {
  children: React.ReactNode
  className: string
}) => {
  return (
    <ReachTooltip className={`${tooltipStyles.Tooltip} ${className}`} {...props}>
      {children}
    </ReachTooltip>
  )
}

export default Tooltip
