import { useState, useRef, useCallback } from 'react'

export default function UploadPanel({ onAnalyzed, onLog, loading, setLoading }) {
  const [prtFile, setPrtFile] = useState(null)
  const [netFile, setNetFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [deratingPct, setDeratingPct] = useState(70)
  const [includeDepop, setIncludeDepop] = useState(false)
  const [voltMap, setVoltMap] = useState('')

  const inputRef = useRef()

  const classifyFile = useCallback((file) => {
    const name = file.name.toLowerCase()
    if (name.includes('prt') || name === 'pstxprt.dat') return 'prt'
    if (name.includes('net') || name === 'pstxnet.dat') return 'net'
    return null
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    files.forEach(file => {
      const kind = classifyFile(file)
      if (kind === 'prt') setPrtFile(file)
      else if (kind === 'net') setNetFile(file)
    })
  }, [classifyFile])

  const handleFileInput = useCallback((e) => {
    Array.from(e.target.files).forEach(file => {
      const kind = classifyFile(file)
      if (kind === 'prt') setPrtFile(file)
      else if (kind === 'net') setNetFile(file)
      else {
        // fallback: first .dat → prt, second → net
        if (!prtFile) setPrtFile(file)
        else if (!netFile) setNetFile(file)
      }
    })
  }, [classifyFile, prtFile, netFile])

  const handleAnalyze = useCallback(async () => {
    if (!prtFile || !netFile) return
    setLoading(true)
    onLog(`正在解析 ${prtFile.name} + ${netFile.name}…`)
    try {
      const form = new FormData()
      form.append('prt_file', prtFile)
      form.append('net_file', netFile)
      form.append('project_name', projectName || prtFile.name.replace(/\.(dat|prt)$/i, ''))
      form.append('derating_pct', deratingPct)
      form.append('include_depop', includeDepop)
      form.append('custom_volt_map', voltMap)

      const res = await fetch('/api/analyze', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || `HTTP ${res.status}`)
      }
      const data = await res.json()
      onAnalyzed(data)
    } catch (e) {
      onLog(`✗ 错误: ${e.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [prtFile, netFile, projectName, deratingPct, includeDepop, voltMap, setLoading, onLog, onAnalyzed])

  const hasFiles = prtFile && netFile

  return (
    <>
      {/* Drop Zone */}
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''} ${hasFiles ? 'has-files' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".dat"
          multiple
          onChange={handleFileInput}
          onClick={e => e.stopPropagation()}
        />
        <div className="upload-icon">{hasFiles ? '✓' : '⊕'}</div>
        <div className="upload-title">{hasFiles ? '文件已就绪' : '拖入 .dat 文件'}</div>
        <div className="upload-hint">pstxprt.dat + pstxnet.dat</div>
      </div>

      {/* File Tags */}
      {(prtFile || netFile) && (
        <div className="file-list">
          {prtFile && (
            <div className="file-tag">
              <span className="dot">●</span>
              <span style={{ color: '#f59e0b', marginRight: 4 }}>PRT</span>
              {prtFile.name}
            </div>
          )}
          {netFile && (
            <div className="file-tag">
              <span className="dot">●</span>
              <span style={{ color: '#3b82f6', marginRight: 4 }}>NET</span>
              {netFile.name}
            </div>
          )}
        </div>
      )}

      {/* Project Name */}
      <div className="field-group">
        <div className="field-label">项目名称</div>
        <input
          className="field-input"
          type="text"
          placeholder="可选"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
        />
      </div>

      {/* Settings */}
      <div className="settings-section" style={{ margin: '0 12px 10px' }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-cond)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: 8 }}>
          降额设置
        </div>
        <div className="settings-row">
          <span className="settings-label">降额上限</span>
          <span className="settings-value">{deratingPct}%</span>
        </div>
        <input
          type="range" min={50} max={100} step={5}
          value={deratingPct}
          onChange={e => setDeratingPct(Number(e.target.value))}
          style={{ width: '100%', marginBottom: 8 }}
        />
        <div className="settings-row">
          <span className="settings-label">包含 DEPOP 元件</span>
          <input
            type="checkbox"
            checked={includeDepop}
            onChange={e => setIncludeDepop(e.target.checked)}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <div className="settings-label" style={{ marginBottom: 4, fontSize: 10, color: 'var(--text-dim)' }}>
            自定义电压映射（NET前缀=电压V）
          </div>
          <textarea
            className="volt-textarea"
            placeholder={"# 示例:\nVCC_12V=12\nVBUS=5"}
            value={voltMap}
            onChange={e => setVoltMap(e.target.value)}
          />
        </div>
      </div>

      {/* Analyze Button */}
      <button
        className="btn-analyze"
        disabled={!hasFiles || loading}
        onClick={handleAnalyze}
      >
        {loading ? (
          <>
            <span className="spinner" />
            解析中…
          </>
        ) : (
          <>⚡ 开始分析</>
        )}
      </button>
    </>
  )
}
