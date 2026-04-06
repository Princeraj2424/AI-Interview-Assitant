import { useState } from "react"
import "../interview/style/home.scss"

const Home = () => {
  const [jobDescription, setJobDescription] = useState("")
  const [selfDescription, setSelfDescription] = useState("")
  const [fileName, setFileName] = useState("")
  const [loading, setLoading] = useState(false)

  const maxChars = 3500

  const handleGenerate = () => {
    if (!jobDescription || !fileName) {
      alert("Please fill job description and upload resume")
      return
    }

    setLoading(true)

    // simulate API call
    setTimeout(() => {
      setLoading(false)
      alert("Interview Report Generated ")
    }, 2000)
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
        </header>

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
                onChange={(e) => setFileName(e.target.files[0]?.name || "")}
              />

              <label className="upload-dropzone" htmlFor="resume">
                <span className="upload-icon" aria-hidden="true">▲</span>
                <strong>Click to upload or drag and drop</strong>
                <small>PDF up to 3MB</small>
              </label>

              {fileName && <p className="file-name">Selected: {fileName}</p>}
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