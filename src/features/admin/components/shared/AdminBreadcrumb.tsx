type AdminBreadcrumbItem = {
  label: string
  onClick?: () => void
  current?: boolean
}

type AdminBreadcrumbProps = {
  items: AdminBreadcrumbItem[]
  className?: string
}

export function AdminBreadcrumb({ items, className = '' }: AdminBreadcrumbProps) {
  const classes = ['tenant-breadcrumb', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <i className="fa-solid fa-house"></i>
      {items.map((item, index) => {
        const isCurrent = item.current ?? index === items.length - 1

        return (
          <span className="breadcrumb-item" key={`${item.label}-${index}`}>
            {index > 0 && <span className="breadcrumb-separator">/</span>}
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
