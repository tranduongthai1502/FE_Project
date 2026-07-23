import { useEffect, useId, useRef, useState } from 'react'

export type AdminScrollableSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export function AdminScrollableSelect({
  value,
  options,
  placeholder = 'Select',
  ariaLabel,
  disabled = false,
  invalid = false,
  className = '',
  onChange,
}: {
  value: string
  options: AdminScrollableSelectOption[]
  placeholder?: string
  ariaLabel?: string
  disabled?: boolean
  invalid?: boolean
  className?: string
  onChange: (value: string) => void
}) {
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find((option) => option.value === value)
  const selectedLabel = selectedOption?.label || placeholder

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const selectValue = (nextValue: string, optionDisabled?: boolean) => {
    if (optionDisabled) return
    onChange(nextValue)
    setIsOpen(false)
  }

  return (
    <div
      ref={rootRef}
      className={`admin-scroll-select ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''} ${invalid ? 'has-error' : ''} ${className}`.trim()}
    >
      <button
        type="button"
        className="admin-scroll-select-trigger"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{selectedLabel}</span>
        <i className="fa-solid fa-chevron-down" aria-hidden="true"></i>
      </button>

      {isOpen && (
        <div className="admin-scroll-select-menu" id={listboxId} role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <button
              type="button"
              key={option.value || option.label}
              className={option.value === value ? 'selected' : ''}
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              onClick={() => selectValue(option.value, option.disabled)}
            >
              {option.value === value && <i className="fa-solid fa-check" aria-hidden="true"></i>}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
