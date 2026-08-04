import type { ReactNode } from 'react'

export type ListTablePageItem = number | 'ellipsis'

export function ListTable({
  cardClassName,
  rowClassName,
  headClassName,
  stateClassName,
  bodyClassName,
  columns,
  toolbar,
  isLoading,
  error,
  empty,
  loadingMessage,
  errorMessage,
  emptyMessage,
  children,
  pagination,
}: {
  cardClassName: string
  rowClassName: string
  headClassName: string
  stateClassName: string
  bodyClassName?: string
  columns: string[]
  toolbar?: ReactNode
  isLoading: boolean
  error?: string
  empty: boolean
  loadingMessage: string
  errorMessage?: string
  emptyMessage: string
  children: ReactNode
  pagination: {
    label: string
    currentPage: number
    pageCount: number
    pageItems: ListTablePageItem[]
    onPageChange: (page: number) => void
    ellipsisKeyPrefix: string
    buttonClassName?: string
    activeButtonClassName?: string
    ellipsisClassName?: string
  }
}) {
  return (
    <section className={cardClassName}>
      {toolbar}

      <div className={`${rowClassName} ${headClassName}`}>
        {columns.map((column) => <span key={column}>{column}</span>)}
      </div>

      {isLoading ? (
        <div className={stateClassName}>{loadingMessage}</div>
      ) : error ? (
        <div className={`${stateClassName} error`}>{errorMessage || error}</div>
      ) : empty ? (
        <div className={stateClassName}>{emptyMessage}</div>
      ) : bodyClassName ? (
        <div className={bodyClassName}>{children}</div>
      ) : (
        children
      )}

      <footer>
        <span>{pagination.label}</span>
        <div>
          <button
            type="button"
            className={`icon-tooltip ${pagination.buttonClassName || ''}`.trim()}
            data-tooltip="Previous page"
            disabled={pagination.currentPage === 1}
            onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          {pagination.pageItems.map((item, index) => (
            item === 'ellipsis' ? (
              <span className={pagination.ellipsisClassName || 'pagination-ellipsis'} key={`${pagination.ellipsisKeyPrefix}-ellipsis-${index}`}>...</span>
            ) : (
              <button
                type="button"
                className={item === pagination.currentPage ? (pagination.activeButtonClassName || 'active') : ''}
                key={item}
                onClick={() => pagination.onPageChange(item)}
              >
                {item}
              </button>
            )
          ))}
          <button
            type="button"
            className={`icon-tooltip ${pagination.buttonClassName || ''}`.trim()}
            data-tooltip="Next page"
            disabled={pagination.currentPage === pagination.pageCount}
            onClick={() => pagination.onPageChange(Math.min(pagination.pageCount, pagination.currentPage + 1))}
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </footer>
    </section>
  )
}
