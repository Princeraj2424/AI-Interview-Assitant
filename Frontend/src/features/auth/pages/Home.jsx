import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import "../interview/style/home.scss"
import { useInterview } from "../hooks/useInterview"

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

const Home = () => {
  const { loading, generateReport, reports, getAllReports } = useInterview()
  const navigate = useNavigate()                        
  const [jobDescription, setJobDescription] = useState("")
  const [selfDescription, setSelfDescription] = useState("")
  const [resumeFile, setResumeFile] = useState(null)
  const [error, setError] = useState("")


  const maxChars = 3500

  useEffect(() => {
    getAllReports()
  }, [getAllReports])

  const recentReports = useMemo(() => (Array.isArray(reports) ? reports.slice(0, 4) : []), [reports])

  const handleGenerate = async () => {                  
    if (!resumeFile) {
      setError("Please upload your resume PDF before generating the interview plan.")
      return
    }

    const isPdf = resumeFile.type === "application/pdf" || resumeFile.name?.toLowerCase().endsWith(".pdf")
    if (!isPdf) {
      setError("Only PDF resume files are allowed.")
      return
    }

    if (resumeFile.size > 3 * 1024 * 1024) {
      setError("Resume PDF must be 3MB or smaller.")
      return
    }

    if (!jobDescription.trim()) {
      setError("Please paste the job description first.")
      return
    }

    setError("")
    try {
      const report = await generateReport({ jobDescription, resume: resumeFile, selfDescription })
      if (report?._id) {
        navigate(`/interview/${report._id}`, { state: { report } })
      }
    } catch (error) {
      setError(error?.message || "Unable to generate interview strategy right now")
    }
  }

    if(loading){
      return(
        <main className="loading-screen">
          <h1>Loading...</h1>
            </main>
      )
    }

  return (
    <main className="home-page">
      <div className="home-shell">
        <header className="hero-header">
          <h1>
            Create Your Custom <span>Interview Plan</span>
          </h1>
          <p>
            Let our AI analyze your profile and target role, then build a winning interview strategy.
          </p>
          <button
            type="button"
            className="recent-open-btn"
            style={{ marginTop: "0.8rem", maxWidth: "220px" }}
            onClick={() => navigate("/home")}
          >
            Back To Dashboard
          </button>
        </header>

        {error && <div className="form-error" role="alert">{error}</div>}

        <section className="plan-card">
          <div className="panel panel-left">
            <div className="panel-title-row">
              <span className="dot" />
              <h2>Target Job Description</h2>
              <span className="required">Required</span>
            </div>

            <textarea
              name="jobDescription"
              id="jobDescription"
              placeholder="Paste the full job description here."
              value={jobDescription}
              maxLength={maxChars}
              onChange={(e) => setJobDescription(e.target.value)}
            />

            <div className="char-count">
              {jobDescription.length} / {maxChars} chars
            </div>
          </div>

          <div className="panel panel-right">
            <div className="panel-title-row">
              <span className="dot" />
              <h2>Your Profile</h2>
            </div>

            <div className="field-block">
              <label htmlFor="resume">Upload Resume</label>
              <p className="field-hint">PDF format only</p>

              <input
                className="native-file"
                type="file"
                name="resume"
                id="resume"
                accept=".pdf"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              />

              <label className="upload-dropzone" htmlFor="resume">
                <span className="upload-icon" aria-hidden="true">▲</span>
                <strong>Click to upload or drag and drop</strong>
                <small>PDF up to 3MB</small>
              </label>

              {resumeFile && <p className="file-name">Selected: {resumeFile.name}</p>}
            </div>

            <div className="divider">OR</div>

            <div className="field-block">
              <label htmlFor="selfDescription">Quick Self-Description</label>
              <textarea
                name="selfDescription"
                id="selfDescription"
                placeholder="Briefly describe your experience, key skills, and years of practice."
                value={selfDescription}
                onChange={(e) => setSelfDescription(e.target.value)}
              />
            </div>

            <div className="info-note">
              Enter a resume or self-description to generate a personalized strategy.
            </div>

            <button
              className={`generate-btn ${loading ? "loading" : ""}`}
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate My Interview Strategy"}
            </button>
          </div>
        </section>

        <section className="recent-section">
          <div className="recent-heading">
            <h2>Recent Reports</h2>
            <p>Jump back into your latest interview plans.</p>
          </div>

          {recentReports.length === 0 ? (
            <div className="recent-empty">No reports yet. Generate your first interview strategy above.</div>
          ) : (
            <div className="recent-grid">
              {recentReports.map((item) => (
                <article key={item._id} className="recent-card">
                  <div className="recent-top">
                    <h3>{item.title || "Interview Report"}</h3>
                    <span className="recent-score">{Number(item.matchScore || 0)}/100</span>
                  </div>
                  <p className="recent-date">Created {formatDate(item.createdAt)}</p>
                  <button
                    type="button"
                    className="recent-open-btn"
                    onClick={() => navigate(`/interview/${item._id}`)}
                  >
                    Open Report
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="hero-footer">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Help Center</span>
        </footer>
      </div>
    </main>
  )
}

export default Home