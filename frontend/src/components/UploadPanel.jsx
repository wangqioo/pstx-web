import { useState, useRef, useCallback } from 'react'

export default function UploadPanel({ onAnalyzed, onLog, loading, setLoading }) {
  const [prtFile, setPrtFile]   = useState(null)
  const [netFile, setNetFile]   = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [deratingPct, setDeratingPct] = useState(70)
  const [includeDepop, setIncludeDepop] = useState(false)
  const [voltMap, setVoltMap]   = useState('')
  const [scanMode, setScanMode] = useState('folder') // 'folder' | 'files'
  const [scanFound, setScanFound] = useState([])     // [{prt, net, label}]
  const [selectedIdx, setSelectedIdx] = useState(0)

  const fileInputRef   = useRef()
  const folderInputRef = useRef()

  // ── 文件分类 ───────────────────────────────────
  const classifyFile = useCallback((file) => {
    const name = (file.webkitRelativePath || file.name).toLowerCase()
    if (/pstxprt|prt\.dat$|_prt\.dat$/i.test(name)) return 'prt'
    if (/pstxnet|net\.dat$|_net\.dat$/i.test(name)) return 'net'
    if (name.endsWith('.dat') && name.includes('prt')) return 'prt'
    if (name.endsWith('.dat') && name.includes('net')) return 'net'
    return null
  }, [])

  // ── 拖拽单文件处理 ─────────────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    let prt = null, net = null
    files.forEach(f => {
      const k = classifyFile(f)
      if (k === 'prt') prt = f
      else if (k === 'net') net = f
    })
    if (prt) setPrtFile(prt)
    if (net) setNetFile(net)
    if (prt || net) setScanMode('files')
  }, [classifyFile])

  // ── 选择文件夹，自动扫描所有 .dat ──────────────
  const handleFolderInput = useCallback((e) => {
    const all = Array.from(e.target.files)
    const dats = all.filter(f => f.name.toLowerCase().endsWith('.dat'))

    if (dats.length === 0) {
      onLog('所选文件夹中未找到 .dat 文件', 'error')
      return
    }

    // 按目录分组，自动配对 prt + net
    const byDir = {}
    dats.forEach(f => {
      const parts = (f.webkitRelativePath || f.name).split('/')
      const dir   = parts.slice(0, -1).join('/') || '根目录'
      if (!byDir[dir]) byDir[dir] = []
      byDir[dir].push(f)
    })

    const pairs = []
    Object.entries(byDir).forEach(([dir, files]) => {
      let prt = files.find(f => classifyFile(f) === 'prt')
      let net = files.find(f => classifyFile(f) === 'net')
      if (!prt && !net) {
        // fallback: 两个dat文件，第一个当prt，第二个当net
        if (files.length >= 2) { prt = files[0]; net = files[1] }
        else return
      }
      if (prt && net) {
        pairs.push({ prt, net, label: dir })
      }
    })

    if (pairs.length === 0) {
      // 全局 fallback：找 prt/net 各一个
      const prt = dats.find(f => classifyFile(f) === 'prt')
      const net = dats.find(f => classifyFile(f) === 'net')
      if (prt && net) {
        pairs.push({ prt, net, label: '根目录' })
      }
    }

    if (pairs.length === 0) {
      onLog(`找到 ${dats.length} 个 .dat 文件，但无法自动配对 prt/net，请手动选择`, 'error')
      return
    }

    setScanFound(pairs)
    setSelectedIdx(0)
    setPrtFile(pairs[0].prt)
    setNetFile(pairs[0].net)
    setScanMode('folder')

    // 自动填充项目名（取文件夹根名）
    if (!projectName && all.length > 0) {
      const rootDir = (all[0].webkitRelativePath || '').split('/')[0]
      if (rootDir) setProjectName(rootDir)
    }

    onLog(`扫描到 ${pairs.length} 组 prt+net 文件，已自动选择第 1 组`)
    e.target.value = ''
  }, [classifyFile, onLog, projectName])

  // ── 手动选择单文件 ─────────────────────────────
  const handleFileInput = useCallback((e) => {
    Array.from(e.target.files).forEach(file => {
      const kind = classifyFile(file)
      if (kind === 'prt') setPrtFile(file)
      else if (kind === 'net') setNetFile(file)
      else {
        if (!prtFile) setPrtFile(file)
        else if (!netFile) setNetFile(file)
      }
    })
    setScanFound([])
    setScanMode('files')
    e.target.value = ''
  }, [classifyFile, prtFile, netFile])

  // ── 从扫描列表切换工程 ─────────────────────────
  const selectScanPair = (idx) => {
    setSelectedIdx(idx)
    setPrtFile(scanFound[idx].prt)
    setNetFile(scanFound[idx].net)
  }

  // ── 分析 ───────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!prtFile || !netFile) return
    setLoading(true)
    onLog(`解析 ${prtFile.name} + ${netFile.name}…`)
    try {
      const form = new FormData()
      form.append('prt_file', prtFile)
      form.append('net_file', netFile)
      form.append('project_name', projectName || prtFile.name.replace(/\.(dat|prt)$/i, ''))
      form.append('derating_pct', deratingPct)
      form.append('include_depop', includeDepop)
      form.append('custom_volt_map', voltMap)

      const res = await fetch('/api/analyze', { method: 'POST', body: form })
      if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`)
      const data = await res.json()
      onAnalyzed(data)
    } catch (e) {
      onLog(`✗ ${e.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [prtFile, netFile, projectName, deratingPct, includeDepop, voltMap, setLoading, onLog, onAnalyzed])

  const hasFiles = prtFile && netFile

  return (
    <>
      {/* ── 模式切换 ── */}
      <div style={{ display: 'flex', margin: '0 12px 8px', gap: 4 }}>
        <button
          onClick={() => { setScanMode('folder'); folderInputRef.current?.click() }}
          style={{
            flex: 1, padding: '6px 0',
            background: scanMode === 'folder' ? 'var(--amber-glow)' : 'var(--bg-surface)',
            border: `1px solid ${scanMode === 'folder' ? 'var(--amber)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: scanMode === 'folder' ? 'var(--amber)' : 'var(--text-dim)',
            cursor: 'pointer',
          }}
        >
          ⊞ 选文件夹
        </button>
        <button
          onClick={() => { setScanMode('files'); fileInputRef.current?.click() }}
          style={{
            flex: 1, padding: '6px 0',
            background: scanMode === 'files' ? 'var(--amber-glow)' : 'var(--bg-surface)',
            border: `1px solid ${scanMode === 'files' ? 'var(--amber)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-cond)', fontSize: 12, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            color: scanMode === 'files' ? 'var(--amber)' : 'var(--text-dim)',
            cursor: 'pointer',
          }}
        >
          ⊕ 选文件
        </button>
      </div>

      {/* 隐藏 input */}
      <input ref={folderInputRef} type="file" webkitdirectory="" style={{ display:'none' }} onChange={handleFolderInput} />
      <input ref={fileInputRef}   type="file" accept=".dat" multiple style={{ display:'none' }} onChange={handleFileInput} />

      {/* ── 拖放区 ── */}
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''} ${hasFiles ? 'has-files' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => folderInputRef.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        <div className="upload-icon">{hasFiles ? '✓' : '⊞'}</div>
        <div className="upload-title">
          {hasFiles ? '文件已就绪' : '拖入文件夹 / .dat 文件'}
        </div>
        <div className="upload-hint">
          自动查找 pstxprt.dat + pstxnet.dat
        </div>
      </div>

      {/* ── 多工程选择列表（扫描到多个时显示）── */}
      {scanFound.length > 1 && (
        <div style={{ margin: '4px 12px 6px' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-cond)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 4 }}>
            找到 {scanFound.length} 组工程文件
          </div>
          {scanFound.map((pair, idx) => (
            <div
              key={idx}
              onClick={() => selectScanPair(idx)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 8px', marginBottom: 2,
                background: idx === selectedIdx ? 'var(--amber-glow)' : 'var(--bg-surface)',
                border: `1px solid ${idx === selectedIdx ? 'var(--amber)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                cursor: 'pointer', fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: idx === selectedIdx ? 'var(--amber)' : 'var(--text-secondary)',
              }}
            >
              <span style={{ opacity: 0.6 }}>{idx === selectedIdx ? '●' : '○'}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pair.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── 已选文件标签 ── */}
      {(prtFile || netFile) && (
        <div className="file-list">
          {prtFile && (
            <div className="file-tag">
              <span className="dot">●</span>
              <span style={{ color: '#f59e0b', marginRight: 4, flexShrink: 0 }}>PRT</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {prtFile.name}
              </span>
            </div>
          )}
          {netFile && (
            <div className="file-tag">
              <span className="dot">●</span>
              <span style={{ color: '#3b82f6', marginRight: 4, flexShrink: 0 }}>NET</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {netFile.name}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── 项目名称 ── */}
      <div className="field-group">
        <div className="field-label">项目名称</div>
        <input
          className="field-input" type="text" placeholder="可选"
          value={projectName} onChange={e => setProjectName(e.target.value)}
        />
      </div>

      {/* ── 降额设置 ── */}
      <div className="settings-section" style={{ margin: '0 12px 10px' }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-cond)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: 8 }}>
          降额设置
        </div>
        <div className="settings-row">
          <span className="settings-label">降额上限</span>
          <span className="settings-value">{deratingPct}%</span>
        </div>
        <input type="range" min={50} max={100} step={5} value={deratingPct}
          onChange={e => setDeratingPct(Number(e.target.value))}
          style={{ width: '100%', marginBottom: 8 }} />
        <div className="settings-row">
          <span className="settings-label">包含 DEPOP</span>
          <input type="checkbox" checked={includeDepop} onChange={e => setIncludeDepop(e.target.checked)} />
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>
            自定义电压映射（NET前缀=V）
          </div>
          <textarea className="volt-textarea" placeholder={"# 示例:\nVCC_12V=12\nVBUS=5"}
            value={voltMap} onChange={e => setVoltMap(e.target.value)} />
        </div>
      </div>

      {/* ── 分析按钮 ── */}
      <button className="btn-analyze" disabled={!hasFiles || loading} onClick={handleAnalyze}>
        {loading ? <><span className="spinner" />解析中…</> : <>⚡ 开始分析</>}
      </button>
    </>
  )
}
