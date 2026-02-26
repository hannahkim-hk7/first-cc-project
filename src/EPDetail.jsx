import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const PRODUCTS = [
  { label: 'Grow',       column: 'allow_grow_access' },
  { label: 'TR Global',  column: 'allow_global_access' },
  { label: 'Navigator',  column: 'allow_navigator_access' },
  { label: 'Academy',    column: 'allow_academy_access' },
]

function Badge({ value }) {
  return (
    <span className={`badge ${value ? 'badge-yes' : 'badge-no'}`}>
      {value ? 'Yes' : 'No'}
    </span>
  )
}

export default function EPDetail({ ep, onBack }) {
  const [counts, setCounts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchCounts() {
      const { data, error } = await supabase
        .from('product_access_events')
        .select('user_id, allow_grow_access, allow_global_access, allow_navigator_access, allow_academy_access')
        .eq('employer_partner_id', ep.id)

      if (error) {
        setError(error.message)
      } else {
        const result = {}
        for (const { label, column } of PRODUCTS) {
          const users = new Set(data.filter((e) => e[column]).map((e) => e.user_id))
          result[label] = users.size
        }
        setCounts(result)
      }
      setLoading(false)
    }
    fetchCounts()
  }, [ep.id])

  return (
    <div className="app">
      <button className="back-btn" onClick={onBack}>
        ← Back
      </button>

      <header className="app-header">
        <h1>{ep.name}</h1>
        <p className="subtitle">Employer Partner detail</p>
      </header>

      <div className="detail-flags">
        <div className="flag-item">
          <span className="flag-label">MPR Enabled</span>
          <Badge value={ep.mprEnabled} />
        </div>
        <div className="flag-item">
          <span className="flag-label">Platform Navigation</span>
          <Badge value={ep.platformNavEnabled} />
        </div>
      </div>

      <div className="detail-section">
        <h2 className="detail-section-title">Product Access Event Count</h2>

        {loading ? (
          <div className="loading-state">Loading counts...</div>
        ) : error ? (
          <div className="error-state">Error loading data: {error}</div>
        ) : (
          <div className="table-wrapper">
            <table className="ep-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Users with Access</th>
                </tr>
              </thead>
              <tbody>
                {PRODUCTS.map(({ label }) => (
                  <tr key={label}>
                    <td><span className="product-tag">{label}</span></td>
                    <td className="count-cell">{counts[label].toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
