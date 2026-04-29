import { useState, useMemo } from 'react'
import DataTable from './DataTable.jsx'

export default function DeratingView({ data = [] }) {
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    if (filter === 'all')  return data
    if (filter === 'fail') return data.filter(r => r['状态']?.startsWith('❌'))
    if (filter === 'ok')   return data.filter(r => r['状态']?.startsWith('✅'))
    if (filter === 'gray') return data.filter(r => r['状态']?.startsWith('⚪'))
    return data
  }, [data, filter])

  const counts = useMemo(() => ({
    fail: data.filter(r => r['状态']?.startsWith('❌')).length,
    ok:   data.filter(r => r['状态']?.startsWith('✅')).length,
    gray: data.filter(r => r['状态']?.startsWith('⚪')).length,
  }), [data])

  const FILTERS = [
    { id: 'all',  label: '全部',   count: data.length, style: {} },
    { id: 'fail', label: '不合格', count: counts.fail, style: { color: 'var(--red)' } },
    { id: 'ok',   label: '合格',   count: counts.ok,   style: { color: 'var(--green)' } },
    { id: 'gray', label: '无法判断', count: counts.gray, style: {} },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Summary strip */}
      <div style={{
        display: 'flex', gap: 1, background: 'var(--border)',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '7px 16px',
            background: filter === f.id ? 'var(--bg-surface)' : 'var(--bg-panel)',
            border: 'none',
            borderBottom: filter === f.id ? '2px solid var(--amber)' : '2px solid transparent',
            fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: filter === f.id ? 'var(--amber)' : 'var(--text-dim)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {f.label}
            <span style={{
              fontSize: 12, fontFamily: 'var(--font-mono)',
              padding: '1px 6px', borderRadius: 10,
              background: 'var(--bg-elevated)', ...f.style,
            }}>{f.count}</span>
          </button>
        ))}
      </div>

      <DataTable
        key={filter}
        rows={filtered}
        highlightCol="状态"
        stickyFirst
        columns={['位号','值','封装','类型','额定电压','推断工作电压(V)','推断来源网络','推断来源类型','降额比','状态','页面','DEPOP']}
      />
    </div>
  )
}
