import { useEffect } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import "./interview.scss"
import { useInterview } from "../hooks/useInterview"

//  Helper: Score label 
function getScoreLabel(score) {
	if (score >= 85) return "Strong Match"
	if (score >= 70) return "Good Potential"
	if (score >= 50) return "Developing"
	return "Needs Preparation"
}

// Helper: Split tasks string into bullet array 
function splitTasks(tasks) {
	return String(tasks)
		.split(/[.;\n]+/)   
		.map((t) => t.trim())
		.filter(Boolean)    
		.slice(0, 4)        
}

//  Main Component 
const Interview = () => {
	const { interviewId } = useParams()
	const location = useLocation()
	const navigate = useNavigate()
	const { loading, report, reportById, downloadSuggestedResume } = useInterview()

	// Fetch report by ID when page loads
	useEffect(() => {
		if (interviewId && !location.state?.report) {
			reportById(interviewId)
		}
	}, [interviewId, location.state?.report, reportById])

	// Get report from navigation state
	const activeReport = location.state?.report || report

	// ── Loading and error states ──
	if (loading) {
		return <main className="interview-page"><p>Loading report...</p></main>
	}

	if (!activeReport) {
		return <main className="interview-page"><p>Report not found.</p></main>
	}

	// ── Prepare data ──
	const score = Number(activeReport.matchScore || 0)
	const ringStyle = { "--score": `${Math.max(0, Math.min(score, 100))}` }

	const technicalQuestions = activeReport.technicalQuestions || []
	const behavioralQuestions = activeReport.behavioralQuestions || []
	const skillGaps = activeReport.skillGaps || []

	const preparationPlan = (activeReport.preparationPlan || []).map((item, index) => ({
		day: item.day || index + 1,
		focus: item.focus || `Preparation block ${index + 1}`,
		tasks: splitTasks(item.tasks || "Practice interview questions and review key concepts.")
	}))

	// ── Render ──
	return (
		<main className="interview-page">
			<div className="interview-shell">

				{/* Hero Section */}
				<section className="report-hero">
					<div className="hero-left">
						<p className="report-kicker">Interview Intelligence Report</p>
						<h1>Strategic Plan For Interview #{interviewId}</h1>
						<p className="hero-copy">
							This report shows your readiness, likely questions, skill gaps,
							and a 5-day preparation roadmap.
						</p>
						<div className="hero-actions">
							<Link to="/home" className="action-btn primary">Back To Dashboard</Link>
							<button
								type="button"
								className="action-btn secondary"
								onClick={() => downloadSuggestedResume(activeReport._id || interviewId)}
							>
								Download AI Resume
							</button>
							<button
								type="button"
								className="action-btn voice"
								onClick={() => navigate(`/interview/${interviewId}/voice`, { state: { report: activeReport } })}
							>
								Start Voice Interview
							</button>
							<button
								type="button"
								className="action-btn ghost"
								onClick={() => window.print()}
							>
								Export As PDF
							</button>
						</div>
					</div>

					{/* Score Ring */}
					<div className="score-card" style={ringStyle}>
						<div className="score-ring">
							<strong>{score}</strong>
							<span>/100</span>
						</div>
						<p className="score-title">{getScoreLabel(score)}</p>
						<small>Role Fit Score</small>
					</div>
				</section>

				<section className="report-grid">

					{/* Skill Gaps */}
					<article className="panel gaps-panel">
						<h2>Skill Gaps To Prioritize</h2>
						<p className="panel-subtitle">Focus on high-severity gaps first.</p>
						<div className="gaps-wrap">
							{skillGaps.map((gap, index) => (
								<div key={index} className={`gap-chip ${gap.severity}`}>
									<span>{gap.skill}</span>
									<em>{gap.severity}</em>
								</div>
							))}
						</div>
					</article>

					{/* Technical Questions */}
					<article className="panel questions-panel">
						<h2>Technical Questions</h2>
						<p className="panel-subtitle">Practice these using your own project examples.</p>
						<div className="qa-list">
							{technicalQuestions.map((item, index) => (
								<div className="qa-card" key={index}>
									<div className="qa-top-row">
										<span className="qa-index">Q{index + 1}</span>
										<h3>{item.question}</h3>
									</div>
									<p><span>Why asked:</span> {item.intention}</p>
									<p><span>How to answer:</span> {item.answer}</p>
								</div>
							))}
						</div>
					</article>

					{/* Behavioral Questions */}
					<article className="panel questions-panel">
						<h2>Behavioral Questions</h2>
						<p className="panel-subtitle">Use STAR format and focus on outcomes.</p>
						<div className="qa-list">
							{behavioralQuestions.map((item, index) => (
								<div className="qa-card" key={index}>
									<div className="qa-top-row">
										<span className="qa-index">B{index + 1}</span>
										<h3>{item.question}</h3>
									</div>
									<p><span>Why asked:</span> {item.intention}</p>
									<p><span>How to answer:</span> {item.answer}</p>
								</div>
							))}
						</div>
					</article>

					{/* Preparation Plan */}
					<article className="panel plan-panel">
						<h2>5-Day Preparation Plan</h2>
						<p className="panel-subtitle">Follow this day by day to build confidence.</p>
						<div className="timeline">
							{preparationPlan.map((dayPlan, index) => (
								<div className="timeline-item" key={index}>
									<div className="day-pill">Day {dayPlan.day}</div>
									<div className="timeline-content">
										<h3>{dayPlan.focus}</h3>
										<ul className="task-list">
											{dayPlan.tasks.map((task, taskIndex) => (
												<li key={taskIndex}>{task}</li>
											))}
										</ul>
									</div>
								</div>
							))}
						</div>
					</article>

				</section>
			</div>
		</main>
	)
}

export default Interview