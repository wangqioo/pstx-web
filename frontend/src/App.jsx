import { useState, useCallback, useEffect } from 'react'
import UploadPanel from './components/UploadPanel.jsx'
import StatsBar from './components/StatsBar.jsx'
import BomView from './components/BomView.jsx'
import NetworkView from './components/NetworkView.jsx'
import DrcView from './components/DrcView.jsx'
import DeratingView from './components/DeratingView.jsx'
import ResistorView from './components/ResistorView.jsx'
import QueryPanel from './components/QueryPanel.jsx'

const TABS = [
  { id: 'bom',      label: 'BOM',       icon: '◈' },
  { id: 'network',  label: '网络',       icon: '◉' },
  { id: 'drc',      label: 'DRC 检查',  icon: '◇' },
  { id: 'derating', label: '降额分析',   icon: '▽' },
  { id: 'resistor', label: '电阻检查',   icon: '≋' },
  { id: 'query',    label: '元件查询',   icon: '⌕' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('bom')
  const [result, setResult]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [logs, setLogs]           = useState([])
  const [theme, setTheme]         = useState(() =>
    localStorage.getItem('pstx-theme') || 'dark'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '')
    localStorage.setItem('pstx-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const addLog = useCallback((msg, type = '') => {
    setLogs(prev => [...prev.slice(-30), { msg, type, id: Date.now() + Math.random() }])
  }, [])

  const handleAnalyzed = useCallback((data) => {
    setResult(data)
    addLog(`✓ 解析完成 — ${data.stats?.total_components ?? 0} 个元件，${data.stats?.total_nets ?? 0} 条网络`, 'success')
  }, [addLog])

  const handleExport = useCallback(async () => {
    if (!result) return
    addLog('正在生成 Excel…')
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${result.project_name || 'pstx_report'}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      addLog('✓ Excel 导出完成', 'success')
    } catch (e) {
      addLog(`✗ 导出失败: ${e.message}`, 'error')
    }
  }, [result, addLog])

  const tabBadge = (id) => {
    if (!result) return null
    const s = result.stats || {}
    if (id === 'drc') {
      const n = s.drc_issues ?? 0
      return n > 0 ? { label: n, cls: 'warn' } : { label: 0, cls: 'ok' }
    }
    if (id === 'derating') {
      const n = s.derating_fail ?? 0
      return n > 0 ? { label: n, cls: 'error' } : { label: s.derating_total ?? 0, cls: 'ok' }
    }
    if (id === 'bom')      return { label: s.bom_normal_count ?? 0, cls: '' }
    if (id === 'network')  return { label: (result.net_analysis?.total) ?? 0, cls: '' }
    if (id === 'resistor') {
      const n = (result.resistors?.dup_pullups?.length ?? 0) +
                (result.resistors?.divider_risks?.filter(r => r['状态']?.startsWith('❌'))?.length ?? 0)
      return n > 0 ? { label: n, cls: 'warn' } : null
    }
    return null
  }

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">PST</div>
            <div style={{ flex: 1 }}>
              <div className="brand-name">PSTX Analyzer</div>
            </div>
            <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? '切换浅色' : '切换深色'}>
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>
          <div className="brand-sub">Cadence Schematic Tool — v1.2 Web</div>
        </div>

        <div className="sidebar-body">
          <UploadPanel
            onAnalyzed={handleAnalyzed}
            onLog={addLog}
            loading={loading}
            setLoading={setLoading}
          />
        </div>

        <div className="sidebar-footer">
          <button
            className="btn-export"
            style={{ width: '100%', marginBottom: '8px' }}
            disabled={!result}
            onClick={handleExport}
          >
            ↓ 导出 Excel 报告
          </button>
          <div className="log-area">
            {logs.slice(-4).map(l => (
              <div key={l.id} className={`log-line ${l.type}`}>{l.msg}</div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-area">
        {result ? (
          <>
            <StatsBar stats={result.stats} projectName={result.project_name} />

            <nav className="tab-bar">
              {TABS.map(tab => {
                const badge = tabBadge(tab.id)
                return (
                  <button
                    key={tab.id}
                    className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                    {badge && (
                      <span className={`tab-badge ${badge.cls}`}>{badge.label}</span>
                    )}
                  </button>
                )
              })}
            </nav>

            <div className="tab-content fade-in">
              {activeTab === 'bom'      && <BomView data={result} />}
              {activeTab === 'network'  && <NetworkView data={result.net_analysis} />}
              {activeTab === 'drc'      && <DrcView data={result.drc} />}
              {activeTab === 'derating' && <DeratingView data={result.derating} />}
              {activeTab === 'resistor' && <ResistorView data={result.resistors} />}
              {activeTab === 'query'    && <QueryPanel result={result} onLog={addLog} />}
            </div>
          </>
        ) : (
          <WelcomeScreen />
        )}
      </main>
    </div>
  )
}

function WelcomeScreen() {
  return (
    <div className="welcome">
      <div className="welcome-grid" />
      <div className="welcome-content">
        <div className="welcome-logo">PST<span>X</span></div>
        <div className="welcome-version">Cadence Schematic Analyzer · Web Edition · v1.2</div>
        <p className="welcome-desc">
          解析 Cadence Packager-XL 导出的 pstxprt.dat / pstxnet.dat，<br />
          一键完成 BOM 管理、网络拓扑分析、DRC 检查、电容降额和电阻设计审查。
        </p>
        <div className="feature-grid">
          {[
            { icon: '◈', name: 'BOM 管理', desc: '贴装/DEPOP 明细与汇总' },
            { icon: '◉', name: '网络拓扑', desc: '电源/地/差分对分析' },
            { icon: '◇', name: 'DRC 检查', desc: '缺料、TBD、悬空网络' },
            { icon: '▽', name: '降额分析', desc: '电容工作电压自动推断' },
            { icon: '≋', name: '电阻检查', desc: '上下拉/串阻/OD缺上拉' },
            { icon: '⌕', name: '元件查询', desc: '按位号或网络名检索' },
          ].map(f => (
            <div key={f.name} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-name">{f.name}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
