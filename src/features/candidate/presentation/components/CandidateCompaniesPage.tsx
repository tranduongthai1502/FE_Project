import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Breadcrumb } from '@/core/components/Breadcrumb'
import { getCompactPageItems, getListPageCount, getListTotalElements } from '@/core/utils/pagination'
import { useCandidateCompanies } from '../../application/useCandidateCompanies'

const companyLogoColors = ['blue', 'red', 'white', 'yellow', 'gold', 'green'] as const

function getCompanyLogo(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'CO'
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase()
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase()
}

export function CandidateCompaniesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const pageSize = 9
  const companiesQuery = useCandidateCompanies({ page, size: pageSize })
  const companies = companiesQuery.data ?? []
  const totalCompanies = getListTotalElements(companies, companies.length)
  const pageCount = getListPageCount(companies, page, pageSize)
  const pageItems = getCompactPageItems(page, pageCount)
  const firstItem = companies.length > 0 ? ((page - 1) * pageSize) + 1 : 0
  const lastItem = Math.min(page * pageSize, totalCompanies)

  const goToPage = (nextPage: number) => {
    const normalizedPage = Math.min(Math.max(1, nextPage), pageCount)
    if (normalizedPage !== page) setPage(normalizedPage)
  }

  return (
    <section className="candidate-companies-page">
      <Breadcrumb
        className="candidate-breadcrumb"
        items={[{ label: 'Home', onClick: () => navigate('/candidate') }, { label: 'Companies' }]}
      />

      <header className="candidate-companies-header">
        <div>
          <h1>Companies</h1>
          <p>Discover great companies and explore career opportunities.</p>
        </div>
      </header>

      <div className="candidate-company-filters candidate-company-grid-filters">
        <label className="candidate-company-search">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input type="search" placeholder="Search company name or industry..." />
        </label>
        <div className="candidate-company-filter-actions">
          <button type="button">
            <i className="fa-solid fa-location-dot"></i>
            All Locations
            <i className="fa-solid fa-chevron-down"></i>
          </button>
          <button type="button">
            <i className="fa-solid fa-briefcase"></i>
            All Industries
            <i className="fa-solid fa-chevron-down"></i>
          </button>
        </div>
      </div>

      {companiesQuery.isLoading && <div className="candidate-company-list-state">Loading companies...</div>}
      {companiesQuery.error && <div className="candidate-company-list-state error">Unable to load companies. Please try again.</div>}
      {!companiesQuery.isLoading && !companiesQuery.error && companies.length === 0 && (
        <div className="candidate-company-list-state">No companies found.</div>
      )}

      {!companiesQuery.isLoading && !companiesQuery.error && companies.length > 0 && (
        <div className="candidate-company-card-grid">
          {companies.map((company, index) => (
          <button
            type="button"
            className="candidate-company-card"
            key={company.id}
            onClick={() => navigate(`/candidate/companies/${company.id}`)}
          >
            <span className={`candidate-company-card-logo ${companyLogoColors[index % companyLogoColors.length]}`}>
              {getCompanyLogo(company.name)}
            </span>
            <span className="candidate-company-card-copy">
              <strong>{company.name}</strong>
              <small>{company.industry || 'Career Opportunities'}</small>
              <em>{company.domain || 'No domain provided'}</em>
              <span><i className="fa-solid fa-location-dot"></i><b>{company.region || company.domain || 'Remote'}</b></span>
            </span>
          </button>
          ))}
        </div>
      )}

      <footer className="candidate-company-grid-footer">
        <span>Showing {firstItem} to {lastItem} of {totalCompanies} companies</span>
        <div className="candidate-company-pagination">
          <button
            type="button"
            aria-label="Previous page"
            disabled={page <= 1 || companiesQuery.isFetching}
            onClick={() => goToPage(page - 1)}
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          {pageItems.map((item, index) => item === 'ellipsis'
            ? <span key={`ellipsis-${index}`}>...</span>
            : (
              <button
                type="button"
                className={item === page ? 'active' : ''}
                disabled={companiesQuery.isFetching}
                key={item}
                onClick={() => goToPage(item)}
              >
                {item}
              </button>
            ))}
          <button
            type="button"
            aria-label="Next page"
            disabled={page >= pageCount || companiesQuery.isFetching}
            onClick={() => goToPage(page + 1)}
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </footer>
    </section>
  )
}
