import { useState, useMemo } from 'react'
import DataTable from './DataTable.jsx'

export default function NetworkView({ data = {} }) {
  const [sub, setSub] = useState('overview')

  const powerRows = useMemo(() =>
    Object.entries(data.power_nets ?? {})
      .map(([net, cnt]) => ({ 网络名: net, 节点数: cnt }))
      .sort((a, b) => b.节点数 - a.节点数),
    [data])

  const gndRows = useMemo(() =>
    Object.entries(data.gnd_nets ?? {})
      .map(([net, cnt]) => ({ 网络名: net, 节点数: cnt }))
      .sort((a, b) => b.节点数 - a.节点数),
    [data])

  const diffRows = useMemo(() =>
    Object.entries(data.diff_pairs ?? {})
      .map(([base, pr]) => ({ 基础名: base, 'P 端': pr.P, 'N 端': pr.N }))
      .sort((a, b) => a.基础名.localeCompare(b.基础名)),
    [data])

  const singleRows = useMemo(() =>
    Object.entries(data.single_node ?? {})
      .map(([net, nodes]) => ({
        网络名: net,
        连接元件: nodes[0]?.refdes ?? '',
        引脚: nodes[0]?.pin_name ?? nodes[0]?.pin ?? '',
      })),
    [data])

  const pageRows = useMemo(() =>
    Object.entries(data.page_counter ?? {})
      .map(([page, cnt]) => ({ 页面: page, 元件数: cnt }))
      .sort((a, b) => b.元件数 - a.元件数),
    [data])

  const SUBS = [
    { id: 'overview', label: '概览' },
    { id: 'power',    label: '电源网络', count: powerRows.length },
    { id: 'gnd',      label: 'GND 网络', count: gndRows.length },
    { id: 'diff',     label: '差分对',   count: diffRows.length },
    { id: 'single',   label: '单端网络', count: singleRows.length, cls: singleRows.length > 0 ? 'warn' : '' },
    { id: 'page',     label: '页面分布', count: pageRows.length },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', gap: 1, background: 'var(--border)',
        borderBottom: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap',
      }}>
        {SUBS.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)} style={{
            padding: '7px 14px', background: sub === t.id ? 'var(--bg-surface)' : 'var(--bg-panel)',
            border: 'none', borderBottom: sub === t.id ? '2px solid var(--amber)' : '2px solid transparent',
            fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: sub === t.id ? 'var(--amber)' : 'var(--text-dim)', cursor: 'pointer',
          }}>
            {t.label}
            {t.count !== undefined && (
              <span style={{
                marginLeft: 6, fontSize: 10, fontFamily: 'var(--font-mono)',
                padding: '1px 5px', borderRadius: 10,
                background: t.cls === 'warn' ? 'rgba(249,115,22,0.15)' : 'var(--bg-elevated)',
                color: t.cls === 'warn' ? 'var(--orange)' : 'var(--text-secondary)',
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="tab-content fade-in">
        {sub === 'overview' && (
          <div className="net-grid">
            {[
              { title: '网络总数',      value: data.total ?? 0, cls: '' },
              { title: '电源网络',      value: powerRows.length, cls: 'blue' },
              { title: 'GND 网络',     value: gndRows.length, cls: 'green' },
              { title: '差分对',        value: diffRows.length, cls: '' },
              { title: '单端网络',      value: singleRows.length, cls: singleRows.length > 0 ? 'red' : '' },
              { title: '原理图页面数',  value: pageRows.length, cls: '' },
            ].map(c => (
              <div key={c.title} className={`net-card ${c.cls}`}>
                <div className="net-card-header">
                  <div className="net-card-title">{c.title}</div>
                </div>
                <div className="net-card-count">{c.value}</div>
                {c.title === '单端网络' && c.value > 0 && (
                  <div className="net-card-sub">⚠ 疑似漏连</div>
                )}
              </div>
            ))}
          </div>
        )}
        {sub === 'power'  && <DataTable rows={powerRows} stickyFirst />}
        {sub === 'gnd'    && <DataTable rows={gndRows} stickyFirst />}
        {sub === 'diff'   && <DataTable rows={diffRows} stickyFirst />}
        {sub === 'single' && <DataTable rows={singleRows} stickyFirst />}
        {sub === 'page'   && <DataTable rows={pageRows} stickyFirst />}
      </div>
    </div>
  )
}
