import { useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { useInterview } from "../hooks/useInterview"
import "./dashboard.scss"

function formatDate(value) {
  if (!value) return "Unknown date"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Unknown date"
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  })
}

function getInitials(name) {
  if (!name) return "IC"
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "IC"
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, handleLogout } = useAuth()
  const { reports, getAllReports, loading } = useInterview()

  useEffect(() => {
    getAllReports()
  }, [getAllReports])

  const totalReports = Array.isArray(reports) ? reports.length : 0
  const avgScore = useMemo(() => {
    if (!Array.isArray(reports) || reports.length === 0) return 0
    const sum = reports.reduce((acc, item) => acc + Number(item?.matchScore || 0), 0)
    return Math.round(sum / reports.length)
  }, [reports])
  const latestReports = useMemo(() => (Array.isArray(reports) ? reports.slice(0, 5) : []), [reports])
  const latestReport = latestReports[0] || null
  const bestReport = useMemo(() => {
    if (!Array.isArray(reports) || reports.length === 0) return null
    return [...reports].sort((a, b) => Number(b?.matchScore || 0) - Number(a?.matchScore || 0))[0] || null
  }, [reports])

  async function onLogout() {
    await handleLogout()
    navigate("/login", { replace: true })
  }

  async function onRefresh() {
    await getAllReports()
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div className="dashboard-hero-copy">
            <p className="dashboard-kicker">Interview Copilot</p>
            <h1>Welcome back{user?.username ? `, ${user.username}` : ""}</h1>
            <p className="dashboard-copy">Track your readiness, review your strongest signals, and jump into the next interview session from one command center.</p>
            <div className="dashboard-meta-row">
              <span className="dashboard-meta-pill">{loading ? "Syncing data" : "Live workspace"}</span>
              <span className="dashboard-meta-pill">{totalReports} reports</span>
              <span className="dashboard-meta-pill">{avgScore}/100 avg match</span>
            </div>
          </div>
          <div className="dashboard-profile-card">
            <div className="dashboard-avatar">{getInitials(user?.username || user?.email)}</div>
            <div className="dashboard-profile-copy">
              <span className="dashboard-profile-label">Current status</span>
              <strong>{loading ? "Refreshing reports" : "Ready for the next interview"}</strong>
              <p>{latestReport ? `Latest report updated ${formatDate(latestReport.createdAt)}` : "Create your first interview plan to unlock the dashboard."}</p>
            </div>
          </div>
          <div className="dashboard-header-actions">
            <button type="button" className="dashboard-btn ghost" onClick={() => navigate("/plan")}>Create Plan</button>
            <button type="button" className="dashboard-btn secondary" onClick={onRefresh}>{loading ? "Refreshing..." : "Refresh"}</button>
            <button type="button" className="dashboard-btn danger" onClick={onLogout}>Logout</button>
          </div>
        </header>

        <section className="dashboard-stats">
          <article className="stat-card accent">
            <p>Total Reports</p>
            <h2>{totalReports}</h2>
            <span>All saved interview plans</span>
          </article>
          <article className="stat-card">
            <p>Average Match Score</p>
            <h2>{avgScore}/100</h2>
            <span>Across your recent reports</span>
          </article>
          <article className="stat-card">
            <p>Current Status</p>
            <h2>{loading ? "Syncing" : "Ready"}</h2>
            <span>{loading ? "Pulling the latest data" : "Your workspace is up to date"}</span>
          </article>
        </section>

        <section className="dashboard-feature-grid">
          <article className="dashboard-feature-card featured">
            <div className="panel-head">
              <h3>Featured Insight</h3>
              <p>Your strongest current signal at a glance.</p>
            </div>
            {bestReport ? (
              <div className="featured-score-card">
                <div>
                  <span className="featured-label">Highest match</span>
                  <h2>{bestReport.title || "Interview Report"}</h2>
                  <p>Created {formatDate(bestReport.createdAt)}</p>
                </div>
                <strong>{Number(bestReport.matchScore || 0)}/100</strong>
              </div>
            ) : (
              <div className="empty feature-empty">Create your first interview plan to unlock your featured insight.</div>
            )}
          </article>

          <article className="dashboard-feature-card">
            <div className="panel-head">
              <h3>Next Move</h3>
              <p>Use the fastest path from prep to practice.</p>
            </div>
            <div className="next-step-stack">
              <button type="button" className="next-step-card" onClick={() => navigate("/plan")}>Generate a fresh plan and questions</button>
              <button type="button" className="next-step-card" onClick={onRefresh}>Pull the newest reports</button>
              <button type="button" className="next-step-card" onClick={() => navigate(latestReport ? `/interview/${latestReport._id}` : "/plan")}>Open the latest report</button>
            </div>
          </article>
        </section>

        <section className="dashboard-main-grid">
          <article className="dashboard-panel">
            <div className="panel-head">
              <h3>Quick Actions</h3>
              <p>Jump straight into the highest-value workflows.</p>
            </div>
            <div className="quick-actions">
              <button type="button" onClick={() => navigate("/plan")}>Generate New Interview Plan</button>
              <button type="button" onClick={onRefresh}>Refresh Dashboard Data</button>
              <button type="button" onClick={() => navigate(latestReport ? `/interview/${latestReport._id}` : "/plan")}>Continue Latest Report</button>
            </div>
          </article>

          <article className="dashboard-panel">
            <div className="panel-head">
              <h3>Recent Reports</h3>
              <p>Open your latest interview prep reports and continue where you left off.</p>
            </div>
            {latestReports.length === 0 ? (
              <div className="empty">No reports yet. Create your first interview plan.</div>
            ) : (
              <div className="report-list">
                {latestReports.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    className="report-item"
                    onClick={() => navigate(`/interview/${item._id}`)}
                  >
                    <div className="report-item-copy">
                      <div className="report-item-topline">
                        <h4>{item.title || "Interview Report"}</h4>
                        <span className="report-item-badge">Open</span>
                      </div>
                      <p>Created {formatDate(item.createdAt)}</p>
                    </div>
                    <span className="report-score">{Number(item.matchScore || 0)}/100</span>
                  </button>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>
    </main>
  )
}
