import type { ChangeEventHandler } from 'react'

type AdminSearchInputProps = {
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  placeholder: string
  ariaLabel: string
  className?: string
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = '',
}: AdminSearchInputProps) {
  const classes = ['admin-search-input', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <i className="fa-solid fa-magnifying-glass"></i>
      <input
        maxLength={50}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </div>
  )
}
