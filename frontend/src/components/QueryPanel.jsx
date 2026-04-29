import { useState, useCallback } from 'react'

export default function QueryPanel({ result, onLog }) {
  const [mode, setMode] = useState('位号')
  const [keyword, setKeyword] = useState('')
  const [queryResult, setQueryResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          mode,
          // Pass compact component/net data
          components: Object.fromEntries(
            Object.entries(
              buildComponentMap(result)
            ).slice(0, 5000)
          ),
          nets: buildNetMap(result),
        }),
      })
      const data = await res.json()
      setQueryResult(data)
      onLog(`查询 "${keyword}" → ${data.results?.length ?? 0} 条结果`)
    } catch (e) {
      onLog(`✗ 查询失败: ${e.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [keyword, mode, result, onLog])

  const handleKey = (e) => { if (e.key === 'Enter') handleSearch() }

  return (
    <div className="query-panel">
      <div className="query-input-row">
        <button
          className={`query-mode-btn ${mode === '位号' ? 'active' : ''}`}
          onClick={() => setMode('位号')}
        >位号</button>
        <button
          className={`query-mode-btn ${mode === '网络' ? 'active' : ''}`}
          onClick={() => setMode('网络')}
        >网络</button>
        <input
          className="query-input"
          type="text"
          placeholder={mode === '位号' ? '输入位号，如 C1、U3…' : '输入网络名，如 VCC_3V3…'}
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onKeyDown={handleKey}
        />
        <button className="btn-search" onClick={handleSearch} disabled={loading}>
          {loading ? '…' : '查询'}
        </button>
      </div>

      <div className="query-result">
        {queryResult ? (
          queryResult.results?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⌕</div>
              <div className="empty-title">未找到</div>
              <div className="empty-sub">"{queryResult.keyword}" 无匹配结果</div>
            </div>
          ) : (
            <QueryResults data={queryResult} />
          )
        ) : (
          <div className="empty-state">
            <div className="empty-icon">⌕</div>
            <div className="empty-title">元件 / 网络查询</div>
            <div className="empty-sub">按位号或网络名搜索，支持模糊匹配</div>
          </div>
        )}
      </div>
    </div>
  )
}

function QueryResults({ data }) {
  const { results, mode, keyword } = data
  if (!results?.length) return null

  // Exact single component match
  if (mode === '位号' && results.length === 1 && !results[0]._fuzzy_match) {
    return <CompDetail comp={results[0]} />
  }

  // Exact single net match (nodes array)
  if (mode === '网络' && Array.isArray(results[0]) === false && results[0]?.refdes) {
    return <NetDetail nodes={results} netName={keyword} />
  }

  // Fuzzy list
  return (
    <div>
      <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
        模糊匹配结果 — {results.length} 条
      </div>
      {results.map((r, i) => (
        <div key={i} style={{
          padding: '6px 14px', borderBottom: '1px solid var(--border)',
          fontFamily: 'var(--font-mono)', fontSize: 12, display: 'flex', gap: 12,
        }}>
          <span style={{ color: 'var(--amber)' }}>{r._fuzzy_match || r._net_name || r.refdes || ''}</span>
          {r._node_count !== undefined && (
            <span style={{ color: 'var(--text-dim)' }}>{r._node_count} 节点</span>
          )}
        </div>
      ))}
    </div>
  )
}

function CompDetail({ comp }) {
  const skip = ['nets', '_ctype']
  const fields = Object.entries(comp).filter(([k]) => !skip.includes(k))
  const nets = comp.nets ?? {}

  return (
    <div className="result-card">
      <div className="result-header">
        <span className="result-title">{comp.refdes}</span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {comp.comp_type} · {comp.part_name}
        </span>
      </div>
      <div className="result-body">
        {fields.map(([k, v]) => v ? (
          <div key={k} className="result-row">
            <span className="result-key">{k}</span>
            <span className="result-val">{String(v)}</span>
          </div>
        ) : null)}
        {Object.keys(nets).length > 0 && (
          <>
            <div style={{ padding: '6px 14px 2px', fontFamily: 'var(--font-cond)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginTop: 4 }}>
              引脚 → 网络
            </div>
            <table className="pin-table">
              <tbody>
                {Object.entries(nets).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })).map(([pin, net]) => (
                  <tr key={pin}>
                    <td style={{ color: 'var(--blue)', width: 60 }}>pin {pin}</td>
                    <td style={{ color: 'var(--text-primary)' }}>{net}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}

function NetDetail({ nodes, netName }) {
  return (
    <div className="result-card">
      <div className="result-header">
        <span className="result-title">{netName}</span>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {nodes.length} 节点
        </span>
      </div>
      <div className="result-body">
        <table className="pin-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              {['元件', '引脚', '引脚名'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '4px 14px', fontFamily: 'var(--font-cond)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nodes.map((n, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--amber)' }}>{n.refdes}</td>
                <td style={{ color: 'var(--blue)' }}>{n.pin}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{n.pin_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Helpers to extract component/net maps from analysis result
function buildComponentMap(result) {
  const comps = {}
  const detail = [...(result.bom_normal_detail ?? []), ...(result.bom_depop_detail ?? [])]
  detail.forEach(r => {
    if (r['位号']) comps[r['位号']] = { refdes: r['位号'], ...r }
  })
  return comps
}

function buildNetMap(result) {
  const nets = {}
  const single = result.net_analysis?.single_node ?? {}
  Object.entries(single).forEach(([k, v]) => { nets[k] = v })
  return nets
}
