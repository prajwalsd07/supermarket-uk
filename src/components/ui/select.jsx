import { useLayoutEffect, useRef, useState, useEffect, cloneElement, Children } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { cn } from './utils'

const findSelectedLabel = (children, value) => {
  if (value == null || value === '') return null
  let label = null
  const walk = nodes => {
    Children.forEach(nodes, node => {
      if (!node || typeof node !== 'object') return
      if (node.type === SelectItem && node.props?.value === value) {
        label = node.props?.children ?? null
        return
      }
      if (node.props?.children) walk(node.props.children)
    })
  }
  walk(children)
  return label
}

export function Select({ value, onValueChange, children, ...props }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState(null)
  const ref = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    const fn = e => {
      const insideTrigger = ref.current && ref.current.contains(e.target)
      const insideContent = contentRef.current && contentRef.current.contains(e.target)
      if (!insideTrigger && !insideContent) setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  useLayoutEffect(() => {
    if (!open || !ref.current) return
    const update = () => {
      const triggerRect = ref.current.getBoundingClientRect()
      const gap = 4
      const maxH = Math.min(15 * 16, window.innerHeight - 8 * 16)
      const spaceBelow = window.innerHeight - triggerRect.bottom - gap
      const spaceAbove = triggerRect.top - gap
      const flipUp = spaceBelow < maxH && spaceAbove > spaceBelow

      setCoords({
        left: triggerRect.left,
        width: triggerRect.width,
        ...(flipUp
          ? { bottom: window.innerHeight - triggerRect.top + gap, top: 'auto' }
          : { top: triggerRect.bottom + gap, bottom: 'auto' }),
      })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  const displayValue = findSelectedLabel(children, value)

  return (
    <div ref={ref} className="relative" {...props}>
      {Children.map(children, child => {
        if (!child || typeof child !== 'object') return child
        if (child.type === SelectTrigger) {
          return cloneElement(child, { open, setOpen, value, displayValue })
        }
        if (child.type === SelectContent) {
          return cloneElement(child, {
            open,
            setOpen,
            value,
            onValueChange,
            coords,
            contentRef,
          })
        }
        return child
      })}
    </div>
  )
}

export function SelectTrigger({
  className,
  children,
  open,
  setOpen,
  value,
  displayValue,
  id,
  ...props
}) {
  let placeholder = 'Select...'
  Children.forEach(Children.toArray(children), c => {
    if (c?.type === SelectValue && c.props?.placeholder) placeholder = c.props.placeholder
  })
  return (
    <button
      type="button"
      id={id}
      role="combobox"
      aria-expanded={!!open}
      className={cn(
        'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        className,
      )}
      onClick={() => setOpen(o => !o)}
      {...props}
    >
      <span className={cn('min-w-0 truncate text-left', !value && value !== 0 && 'text-gray-500')}>
        {displayValue ?? value ?? placeholder}
      </span>
      <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
    </button>
  )
}

export function SelectValue({ placeholder }) {
  return placeholder ?? null
}

export function SelectContent({
  className,
  children,
  open,
  setOpen,
  value,
  onValueChange,
  coords,
  contentRef,
  ...props
}) {
  if (!open || !coords || typeof document === 'undefined') return null
  return createPortal(
    <div
      ref={contentRef}
      className={cn(
        'fixed z-[60] max-h-[min(15rem,calc(100dvh-8rem))] overflow-auto overscroll-contain rounded-md border border-gray-200 bg-white py-1 shadow-lg',
        className,
      )}
      style={{ left: coords.left, top: coords.top, bottom: coords.bottom, width: coords.width }}
      {...props}
    >
      {Children.map(children, child => {
        if (child?.type === SelectItem) {
          const val = child.props?.value
          return cloneElement(child, {
            onSelect: () => {
              onValueChange?.(val)
              setOpen(false)
              requestAnimationFrame(() => {
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur()
                }
              })
            },
            selected: val === value,
          })
        }
        return child
      })}
    </div>,
    document.body,
  )
}

export function SelectItem({ children, className, onSelect, selected, ...props }) {
  return (
    <button
      type="button"
      role="option"
      className={cn(
        'relative flex w-full cursor-default items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-gray-100',
        selected && 'bg-gray-100',
        className,
      )}
      onClick={() => onSelect?.()}
      {...props}
    >
      {children}
    </button>
  )
}
