export default function StatsBar({ stats = {}, projectName }) {
  const drcClass = stats.drc_issues > 0 ? 'warn' : 'ok'
  const derClass = stats.derating_fail > 0 ? 'error' : 'ok'

  return (
    <div className="stats-bar">
      <div className="stat-chip">
        <span className="stat-label">项目</span>
        <span className="stat-value" style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>
          {projectName || '—'}
        </span>
      </div>
      <div className="stat-chip">
        <span className="stat-label">元件总数</span>
        <span className="stat-value">{stats.total_components ?? '—'}</span>
      </div>
      <div className="stat-chip">
        <span className="stat-label">贴装 BOM</span>
        <span className="stat-value">{stats.bom_normal_count ?? '—'}</span>
      </div>
      <div className="stat-chip">
        <span className="stat-label">BOM 种类</span>
        <span className="stat-value" style={{ fontSize: 18 }}>{stats.bom_normal_types ?? '—'}</span>
      </div>
      <div className="stat-chip">
        <span className="stat-label">网络总数</span>
        <span className="stat-value" style={{ color: 'var(--blue)' }}>{stats.total_nets ?? '—'}</span>
      </div>
      <div className="stat-chip">
        <span className="stat-label">DRC 问题</span>
        <span className={`stat-value ${drcClass}`}>{stats.drc_issues ?? '—'}</span>
      </div>
      <div className="stat-chip">
        <span className="stat-label">降额不合格</span>
        <span className={`stat-value ${derClass}`}>{stats.derating_fail ?? '—'}</span>
      </div>
      <div className="stat-chip">
        <span className="stat-label">差分对</span>
        <span className="stat-value" style={{ color: 'var(--text-secondary)', fontSize: 18 }}>
          {stats.diff_pairs ?? '—'}
        </span>
      </div>
    </div>
  )
}
