'use client'
import { ReactNode, useState } from 'react'

interface Props {
  content: string
  children: ReactNode
  position?: 'top' | 'bottom'
}

export function Tooltip({ content, children, position = 'top' }: Props) {
  const [show, setShow] = useState(false)

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span className={`
          absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
          left-1/2 -translate-x-1/2
          bg-[#001220] border border-slate-200 rounded px-2 py-1 text-xs text-white
          whitespace-nowrap z-50 shadow-lg
        `}>
          {content}
        </span>
      )}
    </span>
  )
}
