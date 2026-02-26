import { useState, useMemo, useEffect } from 'react'
import { supabase } from './supabase'

const ALL = 'All'
const PRODUCTS = ['Grow', 'TR Global', 'Navigator', 'Academy']

function rowToEP(row) {
  const products = [
    row.offers_grow && 'Grow',
    row.offers_global && 'TR Global',
    row.offers_navigator && 'Navigator',
    row.offers_academy && 'Academy',
  ].filter(Boolean)

  return {
    id: row.id,
    name: row.name,
    mprEnabled: row.mpr_enabled,
    platformNavEnabled: row.platform_nav_enabled,
    products,
  }
}

function SortIcon({ column, sortConfig }) {
  if (sortConfig.key !== column) {
    return <span className="sort-icon neutral">⇅</span>
  }
  return (
    <span className="sort-icon active">
      {sortConfig.direction === 'asc' ? '↑' : '↓'}
    </span>
  )
}

function Badge({ value }) {
  return (
    <span className={`badge ${value ? 'badge-yes' : 'badge-no'}`}>
      {value ? 'Yes' : 'No'}
    </span>
  )
}

function ProductTags({ products }) {
  if (!products.length) return <span className="no-products">—</span>
  return (
    <div className="product-tags">
      {products.map((p) => (
        <span key={p} className="product-tag">
          {p}
        </span>
      ))}
    </div>
  )
}

export default function App() {
  const [employers, setEmployers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [mprFilter, setMprFilter] = useState(ALL)
  const [navFilter, setNavFilter] = useState(ALL)
  const [productFilter, setProductFilter] = useState(ALL)
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })

  useEffect(() => {
    async function fetchEmployers() {
      const { data, error } = await supabase.from('ep_feature_summary').select('*')
      if (error) {
        setError(error.message)
      } else {
        setEmployers(data.map(rowToEP))
      }
      setLoading(false)
    }
    fetchEmployers()
  }, [])

  function handleSort(key) {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    )
  }

  const filtered = useMemo(() => {
    let result = employers

    if (search.trim()) {
      const lower = search.toLowerCase()
      result = result.filter((ep) => ep.name.toLowerCase().includes(lower))
    }

    if (mprFilter !== ALL) {
      const want = mprFilter === 'Enabled'
      result = result.filter((ep) => ep.mprEnabled === want)
    }

    if (navFilter !== ALL) {
      const want = navFilter === 'Enabled'
      result = result.filter((ep) => ep.platformNavEnabled === want)
    }

    if (productFilter !== ALL) {
      result = result.filter((ep) => ep.products.includes(productFilter))
    }

    return result
  }, [employers, search, mprFilter, navFilter, productFilter])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal, bVal

      switch (sortConfig.key) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'mpr':
          aVal = a.mprEnabled ? 1 : 0
          bVal = b.mprEnabled ? 1 : 0
          break
        case 'nav':
          aVal = a.platformNavEnabled ? 1 : 0
          bVal = b.platformNavEnabled ? 1 : 0
          break
        case 'products':
          aVal = a.products.join(', ').toLowerCase()
          bVal = b.products.join(', ').toLowerCase()
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortConfig])

  return (
    <div className="app">
      <header className="app-header">
        <h1>EP Feature Dashboard</h1>
        <p className="subtitle">Employer Partner feature flags and product access</p>
      </header>

      <div className="filters">
        <input
          type="text"
          className="search-input"
          placeholder="Search employer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="filter-select"
          value={mprFilter}
          onChange={(e) => setMprFilter(e.target.value)}
        >
          <option value={ALL}>MPR: All</option>
          <option value="Enabled">MPR: Enabled</option>
          <option value="Disabled">MPR: Disabled</option>
        </select>

        <select
          className="filter-select"
          value={navFilter}
          onChange={(e) => setNavFilter(e.target.value)}
        >
          <option value={ALL}>Platform Nav: All</option>
          <option value="Enabled">Platform Nav: Enabled</option>
          <option value="Disabled">Platform Nav: Disabled</option>
        </select>

        <select
          className="filter-select"
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
        >
          <option value={ALL}>Product: All</option>
          {PRODUCTS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-state">Loading employers...</div>
      ) : error ? (
        <div className="error-state">Error loading data: {error}</div>
      ) : (
        <>
          <div className="result-count">
            {sorted.length} employer{sorted.length !== 1 ? 's' : ''} found
          </div>

          {sorted.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p>No employers match your current filters.</p>
              <p className="empty-hint">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="ep-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('name')} className="sortable">
                      Employer Partner <SortIcon column="name" sortConfig={sortConfig} />
                    </th>
                    <th onClick={() => handleSort('mpr')} className="sortable">
                      MPR Enabled <SortIcon column="mpr" sortConfig={sortConfig} />
                    </th>
                    <th onClick={() => handleSort('nav')} className="sortable">
                      Platform Navigation <SortIcon column="nav" sortConfig={sortConfig} />
                    </th>
                    <th onClick={() => handleSort('products')} className="sortable">
                      Product(s) Offered <SortIcon column="products" sortConfig={sortConfig} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((ep) => (
                    <tr key={ep.id}>
                      <td className="ep-name">{ep.name}</td>
                      <td>
                        <Badge value={ep.mprEnabled} />
                      </td>
                      <td>
                        <Badge value={ep.platformNavEnabled} />
                      </td>
                      <td>
                        <ProductTags products={ep.products} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
