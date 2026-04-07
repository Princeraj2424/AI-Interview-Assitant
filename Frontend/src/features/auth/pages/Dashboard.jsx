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

  async function onLogout() {
    await handleLogout()
    navigate("/login", { replace: true })
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-kicker">Interview Copilot</p>
            <h1>Welcome back{user?.username ? `, ${user.username}` : ""}</h1>
            <p className="dashboard-copy">Track your readiness, manage reports, and start a fresh strategy in one place.</p>
          </div>
          <div className="dashboard-header-actions">
            <button type="button" className="dashboard-btn ghost" onClick={() => navigate("/plan")}>Create Plan</button>
            <button type="button" className="dashboard-btn danger" onClick={onLogout}>Logout</button>
          </div>
        </header>

        <section className="dashboard-stats">
          <article className="stat-card">
            <p>Total Reports</p>
            <h2>{totalReports}</h2>
          </article>
          <article className="stat-card">
            <p>Average Match Score</p>
            <h2>{avgScore}/100</h2>
          </article>
          <article className="stat-card">
            <p>Current Status</p>
            <h2>{loading ? "Syncing" : "Ready"}</h2>
          </article>
        </section>

        <section className="dashboard-main-grid">
          <article className="dashboard-panel">
            <div className="panel-head">
              <h3>Quick Actions</h3>
              <p>Jump to your most used workflows.</p>
            </div>
            <div className="quick-actions">
              <button type="button" onClick={() => navigate("/plan")}>Generate New Interview Plan</button>
              <button type="button" onClick={() => navigate("/home")}>Refresh Dashboard Data</button>
            </div>
          </article>

          <article className="dashboard-panel">
            <div className="panel-head">
              <h3>Recent Reports</h3>
              <p>Open and continue your latest interview prep reports.</p>
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
                    <div>
                      <h4>{item.title || "Interview Report"}</h4>
                      <p>Created {formatDate(item.createdAt)}</p>
                    </div>
                    <span>{Number(item.matchScore || 0)}/100</span>
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
