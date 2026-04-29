import { useState } from 'react'
import DataTable from './DataTable.jsx'

const BOM_TABS = [
  { id: 'merged_normal', label: '贴装 BOM（汇总）' },
  { id: 'merged_depop',  label: 'DEPOP（汇总）' },
  { id: 'detail_normal', label: '贴装 BOM（明细）' },
  { id: 'detail_depop',  label: 'DEPOP（明细）' },
]

export default function BomView({ data }) {
  const [sub, setSub] = useState('merged_normal')

  const tableData = {
    merged_normal: data.bom_normal_merged ?? [],
    merged_depop:  data.bom_depop_merged  ?? [],
    detail_normal: data.bom_normal_detail ?? [],
    detail_depop:  data.bom_depop_detail  ?? [],
  }

  const counts = {
    merged_normal: data.bom_normal_merged?.length ?? 0,
    merged_depop:  data.bom_depop_merged?.length  ?? 0,
    detail_normal: data.bom_normal_detail?.length ?? 0,
    detail_depop:  data.bom_depop_detail?.length  ?? 0,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sub-tabs */}
      <div style={{
        display: 'flex', gap: 1, background: 'var(--border)',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        {BOM_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            style={{
              padding: '7px 14px',
              background: sub === t.id ? 'var(--bg-surface)' : 'var(--bg-panel)',
              border: 'none',
              borderBottom: sub === t.id ? '2px solid var(--amber)' : '2px solid transparent',
              fontFamily: 'var(--font-cond)',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: sub === t.id ? 'var(--amber)' : 'var(--text-dim)',
              cursor: 'pointer',
            }}
          >
            {t.label}
            <span style={{
              marginLeft: 6, fontSize: 10, fontFamily: 'var(--font-mono)',
              padding: '1px 5px', borderRadius: 10,
              background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
            }}>
              {counts[t.id]}
            </span>
          </button>
        ))}
      </div>

      <DataTable
        rows={tableData[sub]}
        stickyFirst
        highlightCol={null}
      />
    </div>
  )
}
