import { useState } from 'react'
import DataTable from './DataTable.jsx'

export default function ResistorView({ data = {} }) {
  const [sub, setSub] = useState('divider_risks')

  const sections = [
    { id: 'divider_risks', label: '串阻分压风险', rows: data.divider_risks ?? [], hlCol: '状态' },
    { id: 'dup_pullups',   label: '重复上拉',     rows: data.dup_pullups   ?? [] },
    { id: 'dup_pulldowns', label: '重复下拉',     rows: data.dup_pulldowns ?? [] },
    { id: 'od_missing',    label: 'OD/OC 缺上拉', rows: data.od_missing    ?? [] },
    { id: 'chip_pin_rows', label: '芯片Pin总览',  rows: data.chip_pin_rows ?? [] },
  ]

  const current = sections.find(s => s.id === sub)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', gap: 1, background: 'var(--border)',
        borderBottom: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap',
      }}>
        {sections.map(s => {
          const hasFail = s.hlCol && s.rows.some(r => r[s.hlCol]?.startsWith('❌'))
          const cls = hasFail ? 'warn' : s.rows.length > 0 ? '' : ''
          return (
            <button key={s.id} onClick={() => setSub(s.id)} style={{
              padding: '7px 14px', background: sub === s.id ? 'var(--bg-surface)' : 'var(--bg-panel)',
              border: 'none', borderBottom: sub === s.id ? '2px solid var(--amber)' : '2px solid transparent',
              fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              color: sub === s.id ? 'var(--amber)' : 'var(--text-dim)', cursor: 'pointer',
            }}>
              {s.label}
              <span style={{
                marginLeft: 6, fontSize: 10, fontFamily: 'var(--font-mono)',
                padding: '1px 5px', borderRadius: 10,
                background: hasFail ? 'rgba(249,115,22,0.15)' : 'var(--bg-elevated)',
                color: hasFail ? 'var(--orange)' : 'var(--text-secondary)',
              }}>{s.rows.length}</span>
            </button>
          )
        })}
      </div>
      <DataTable
        key={sub}
        rows={current?.rows ?? []}
        highlightCol={current?.hlCol}
        stickyFirst
      />
    </div>
  )
}
