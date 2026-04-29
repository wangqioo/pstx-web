import { useState } from 'react'
import DataTable from './DataTable.jsx'

export default function DrcView({ data = {} }) {
  const [sub, setSub] = useState('tbd_attrs')

  const sections = [
    { id: 'tbd_attrs',         label: 'TBD 属性',    rows: data.tbd_attrs         ?? [], cls: 'warn' },
    { id: 'missing_hq_code',   label: '缺料号',      rows: data.missing_hq_code   ?? [], cls: 'warn' },
    { id: 'missing_value',     label: '缺 VALUE',    rows: data.missing_value      ?? [], cls: 'warn' },
    { id: 'missing_package',   label: '缺封装',      rows: data.missing_package   ?? [], cls: 'warn' },
    { id: 'single_pin_nets',   label: '单端网络',    rows: data.single_pin_nets   ?? [], cls: 'warn' },
    { id: 'unnamed_nets',      label: '未命名网络',  rows: data.unnamed_nets      ?? [], cls: '' },
    { id: 'bom_option_components', label: 'BOM_OPTION', rows: data.bom_option_components ?? [], cls: '' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', gap: 1, background: 'var(--border)',
        borderBottom: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap',
      }}>
        {sections.map(s => (
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
              background: s.rows.length > 0 && s.cls === 'warn'
                ? 'rgba(249,115,22,0.15)' : 'var(--bg-elevated)',
              color: s.rows.length > 0 && s.cls === 'warn'
                ? 'var(--orange)' : 'var(--text-secondary)',
            }}>{s.rows.length}</span>
          </button>
        ))}
      </div>
      <DataTable
        key={sub}
        rows={sections.find(s => s.id === sub)?.rows ?? []}
        stickyFirst
      />
    </div>
  )
}
