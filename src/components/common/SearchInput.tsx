import type { ChangeEventHandler } from 'react'

import { FIELD_LENGTH_LIMITS } from '@/services/api/axiosErrorHandler'

type SearchInputProps = {
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  placeholder: string
  ariaLabel: string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = '',
}: SearchInputProps) {
  const classes = ['search-input', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <i className="fa-solid fa-magnifying-glass"></i>
      <input
        maxLength={FIELD_LENGTH_LIMITS.defaultText}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </div>
  )
}
