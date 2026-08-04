type BreadcrumbItem = {
  label: string
  onClick?: () => void
  current?: boolean
}

type BreadcrumbProps = {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const classes = ['breadcrumb', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <i className="fa-solid fa-house"></i>
      {items.map((item, index) => {
        const isCurrent = item.current ?? index === items.length - 1

        return (
          <span className="breadcrumb__item" key={`${item.label}-${index}`}>
            {index > 0 && <span className="breadcrumb__separator">/</span>}
            {isCurrent ? (
              <strong>{item.label}</strong>
            ) : item.onClick ? (
              <button type="button" onClick={item.onClick}>{item.label}</button>
            ) : (
              <span>{item.label}</span>
            )}
          </span>
        )
      })}
    </div>
  )
}
