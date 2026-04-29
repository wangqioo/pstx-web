import { useState, useMemo } from 'react'

function naturalKey(val) {
  return String(val ?? '').replace(/(\d+)/g, n => n.padStart(10, '0')).toUpperCase()
}

function statusClass(val) {
  const s = String(val ?? '')
  if (s.startsWith('❌')) return 'td-status-err'
  if (s.startsWith('✅')) return 'td-status-ok'
  if (s.startsWith('⚠')) return 'td-status-warn'
  if (s.startsWith('⚪')) return 'td-status-gray'
  return ''
}

function rowClass(row, hlCol) {
  if (!hlCol || !row[hlCol]) return ''
  const v = String(row[hlCol])
  if (v.startsWith('❌')) return 'row-error'
  if (v.startsWith('✅')) return 'row-ok'
  return ''
}

export default function DataTable({
  rows = [],
  columns,          // optional explicit column order
  searchable = true,
  highlightCol,     // column name whose value determines row color
  stickyFirst = false,
  maxHeight,
}) {
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState(null)
  const [sortAsc, setSortAsc] = useState(true)

  const cols = useMemo(() => {
    if (columns) return columns
    if (!rows.length) return []
    return Object.keys(rows[0]).filter(k => !k.startsWith('_'))
  }, [rows, columns])

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.trim().toUpperCase()
    return rows.filter(r =>
      cols.some(c => String(r[c] ?? '').toUpperCase().includes(q))
    )
  }, [rows, cols, search])

  const sorted = useMemo(() => {
    if (!sortCol) return filtered
    return [...filtered].sort((a, b) => {
      const ka = naturalKey(a[sortCol])
      const kb = naturalKey(b[sortCol])
      const cmp = ka < kb ? -1 : ka > kb ? 1 : 0
      return sortAsc ? cmp : -cmp
    })
  }, [filtered, sortCol, sortAsc])

  const handleSort = (col) => {
    if (sortCol === col) setSortAsc(v => !v)
    else { setSortCol(col); setSortAsc(true) }
  }

  if (!rows.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">○</div>
        <div className="empty-title">无数据</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: maxHeight ?? '100%' }}>
      {searchable && (
        <div className="table-toolbar">
          <div className="toolbar-search">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="搜索…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="toolbar-tag">
            {filtered.length} / {rows.length} 行
          </span>
        </div>
      )}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {cols.map(col => (
                <th
                  key={col}
                  className={sortCol === col ? 'sorted' : ''}
                  onClick={() => handleSort(col)}
                >
                  {col}
                  <span className="sort-arrow">
                    {sortCol === col ? (sortAsc ? '▲' : '▼') : '⇅'}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={i} className={rowClass(row, highlightCol)}>
                {cols.map((col, ci) => {
                  const val = row[col]
                  const cls = statusClass(val)
                  return (
                    <td
                      key={col}
                      className={`${ci === 0 && stickyFirst ? 'td-refdes' : ''} ${cls}`}
                      title={String(val ?? '')}
                    >
                      {String(val ?? '')}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
