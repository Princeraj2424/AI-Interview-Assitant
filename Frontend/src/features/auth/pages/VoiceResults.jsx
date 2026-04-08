import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useInterview } from "../hooks/useInterview"
import "./VoiceInterview.scss"

function toNumber(value, fallback = 0) {
	const num = Number(value)
	return Number.isFinite(num) ? num : fallback
}

function getPerformanceLabel(score) {
	if (score >= 8.5) return "Outstanding"
	if (score >= 7.5) return "Excellent"
	if (score >= 6.5) return "Good"
	if (score >= 5) return "Fair"
	return "Needs Improvement"
}

function getPerformanceColor(score) {
	if (score >= 8.5) return "#10b981"
	if (score >= 7.5) return "#3b82f6"
	if (score >= 6.5) return "#f59e0b"
	if (score >= 5) return "#f59e0b"
	return "#ef4444"
}

export default function VoiceResults() {
	const { interviewId } = useParams()
	const navigate = useNavigate()
	const { getVoiceFeedback, downloadSuggestedResume } = useInterview()
	const [feedbackData, setFeedbackData] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [downloadingResume, setDownloadingResume] = useState(false)
	const [actionMessage, setActionMessage] = useState("")

	function buildCoachingTips(data, score) {
		const tips = []
		const turns = Array.isArray(data?.turns) ? data.turns : []
		const technicalTurns = turns.filter((turn) => turn?.questionType === "Technical")
		const behavioralTurns = turns.filter((turn) => turn?.questionType === "Behavioral")

		if (technicalTurns.length > 0) {
			const avgTechnicalScore = technicalTurns.reduce((sum, turn) => sum + toNumber(turn?.score), 0) / technicalTurns.length
			if (avgTechnicalScore < 7) {
				tips.push("Technical: Structure answers in 3 steps (approach, trade-offs, final choice).")
			}
		}

		if (behavioralTurns.length > 0) {
			const avgBehavioralScore = behavioralTurns.reduce((sum, turn) => sum + toNumber(turn?.score), 0) / behavioralTurns.length
			if (avgBehavioralScore < 7) {
				tips.push("Behavioral: Use STAR format and include one measurable outcome in each story.")
			}
		}

		if (score < 7) {
			tips.push("Delivery: Keep answers under 45 seconds and lead with your strongest point first.")
		}

		if (!tips.length) {
			tips.push("Great consistency. Next step: practice with stricter timing and deeper follow-up questions.")
		}

		return tips
	}

	async function handleDownloadResume() {
		try {
			setDownloadingResume(true)
			setActionMessage("")
			await downloadSuggestedResume(interviewId)
			setActionMessage("Resume downloaded successfully.")
		} catch (downloadError) {
			setActionMessage("Resume download failed. Please try again.")
			console.error(downloadError)
		} finally {
			setDownloadingResume(false)
		}
	}

	useEffect(() => {
		async function fetchFeedback() {
			try {
				setLoading(true)
				setError(null)
				const data = await getVoiceFeedback(interviewId)
				if (!data) {
					throw new Error("No feedback payload returned")
				}
				setFeedbackData(data)
			} catch (err) {
				setError("Failed to load performance feedback")
				console.error(err)
			} finally {
				setLoading(false)
			}
		}

		fetchFeedback()
	}, [interviewId, getVoiceFeedback])

	if (loading) {
		return (
			<main className="voice-page">
				<div className="voice-shell">
					<section className="voice-panel">
						<p>Loading your performance feedback...</p>
					</section>
				</div>
			</main>
		)
	}

	if (error || !feedbackData) {
		return (
			<main className="voice-page">
				<div className="voice-shell">
					<section className="voice-panel">
						<p>{error || "Failed to load feedback"}</p>
						<Link to={`/interview/${interviewId}`}>Back to Report</Link>
					</section>
				</div>
			</main>
		)
	}

	const fitScore = toNumber(feedbackData.matchScore)
	const performanceScore = toNumber(feedbackData.overallPerformanceScore)
	const performanceLabel = getPerformanceLabel(performanceScore)
	const performanceColor = getPerformanceColor(performanceScore)
	const performancePercentage = Math.round((performanceScore / 10) * 100)
	const fitScoreLabel = fitScore >= 80 ? "Strong Fit" : fitScore >= 65 ? "Good Fit" : fitScore >= 50 ? "Developing Fit" : "Needs Work"
	const safeTurns = Array.isArray(feedbackData.turns) ? feedbackData.turns : []
	const coachingTips = buildCoachingTips(feedbackData, performanceScore)

	return (
		<main className="voice-page">
			<div className="voice-shell">
				<header className="voice-hero">
					<div>
						<p className="voice-kicker">Interview Performance Results</p>
						<h1>{feedbackData.title}</h1>
						<p className="voice-copy">
							Detailed analysis of your voice interview performance with AI-generated feedback.
						</p>
					</div>
					<div className="voice-actions">
						<Link to={`/interview/${interviewId}`} className="voice-link">Back to Report</Link>
						<button type="button" className="voice-btn secondary" onClick={() => window.print()}>
							Print Results
						</button>
						<button type="button" className="voice-btn primary" onClick={() => navigate("/home")}>
							Go to Dashboard
						</button>
					</div>
				</header>

				<section className="results-panel">
					{actionMessage && <p className="results-alert">{actionMessage}</p>}

					{/* Overall Performance */}
					<article className="results-card performance-card">
						<div className="performance-header">
							<h2>Overall Performance</h2>
							<div className="performance-score" style={{ borderColor: performanceColor }}>
								<span className="score-value">{performanceScore}</span>
								<span className="score-max">/10</span>
								<span className="score-percentage" style={{ color: performanceColor }}>
									{performancePercentage}%
								</span>
							</div>
						</div>
						<div className="performance-meter">
							<div
								className="performance-fill"
								style={{
									width: `${performancePercentage}%`,
									backgroundColor: performanceColor
								}}
							/>
						</div>
						<p className="performance-label" style={{ color: performanceColor }}>
							{performanceLabel} Interview Performance
						</p>
					</article>

					{/* Match Score Comparison */}
					<article className="results-card">
						<h2>Role Fit Analysis</h2>
						<div className="analysis-grid">
							<div className="analysis-item">
								<span className="label">Fit Score</span>
								<span className="value">{fitScore}/100</span>
								<span className="value-meta">{fitScoreLabel}</span>
							</div>
							<div className="analysis-item">
								<span className="label">Interview Performance</span>
								<span className="value">{Math.round(performanceScore * 10)}%</span>
								<span className="value-meta">{performanceLabel}</span>
							</div>
						</div>
					</article>

					{/* Strength Areas */}
					{feedbackData.strengthAreas && feedbackData.strengthAreas.length > 0 && (
						<article className="results-card strengths-card">
							<h2>💪 Your Strengths</h2>
							<div className="areas-list">
								{feedbackData.strengthAreas.map((area, index) => (
									<div key={index} className="area-item strength">
										<span className="emoji">✓</span>
										<span>{area}</span>
									</div>
								))}
							</div>
						</article>
					)}

					{/* Improvement Areas */}
					{feedbackData.improvementAreas && feedbackData.improvementAreas.length > 0 && (
						<article className="results-card improvements-card">
							<h2>🎯 Areas for Improvement</h2>
							<div className="areas-list">
								{feedbackData.improvementAreas.map((area, index) => (
									<div key={index} className="area-item">
										<span className="emoji">→</span>
										<span>{area}</span>
									</div>
								))}
							</div>
						</article>
					)}

					<article className="results-card improvements-card">
						<h2>Actionable Coaching</h2>
						<div className="areas-list">
							{coachingTips.map((tip, index) => (
								<div key={index} className="area-item">
									<span className="emoji">•</span>
									<span>{tip}</span>
								</div>
							))}
						</div>
					</article>

					{/* Turn-by-Turn Breakdown */}
					<article className="results-card">
						<h2>Question-by-Question Breakdown</h2>
						{safeTurns.length === 0 ? (
							<p className="voice-muted">No question breakdown is available for this attempt yet.</p>
						) : (
							<div className="turns-grid">
								{safeTurns.map((turn, index) => (
								<div key={index} className="turn-card">
									<div className="turn-header">
										<span className="turn-number">Q{toNumber(turn.questionIndex, index) + 1}</span>
										<span className={`turn-type ${String(turn.questionType || "Technical").toLowerCase()}`}>
											{turn.questionType || "Technical"}
										</span>
										<span className="turn-score">{toNumber(turn.score)}/10</span>
									</div>
									<div className="turn-content">
										<div className="turn-question">
											<strong>Question:</strong>
											<p>{turn.question || "Question data unavailable."}</p>
										</div>
										<div className="turn-answer">
											<strong>Your Answer:</strong>
											<p>{turn.userAnswer || "Answer transcript unavailable."}</p>
										</div>
										<div className="turn-feedback">
											<strong>Feedback:</strong>
											<p>{turn.feedback || "Feedback unavailable."}</p>
										</div>
									</div>
									<div className="turn-score-meter">
										<div className="meter-fill" style={{ width: `${(toNumber(turn.score) / 10) * 100}%` }} />
									</div>
								</div>
								))}
							</div>
						)}
					</article>

					{/* Download Options */}
					<article className="results-card actions-card">
						<h2>Next Steps</h2>
						<div className="actions-grid">
								<button className="action-option" onClick={handleDownloadResume} disabled={downloadingResume}>
								<span className="action-icon">📄</span>
									<span className="action-text">{downloadingResume ? "Downloading..." : "Download AI Resume"}</span>
							</button>
							<button className="action-option" onClick={() => navigate(`/interview/${interviewId}`)}>
								<span className="action-icon">📋</span>
								<span className="action-text">View Full Interview Report</span>
							</button>
							<button className="action-option" onClick={() => navigate("/home")}>
								<span className="action-icon">🏠</span>
								<span className="action-text">Return to Dashboard</span>
							</button>
							<button className="action-option" onClick={() => navigate(`/interview/${interviewId}/voice`)}>
								<span className="action-icon">🔄</span>
								<span className="action-text">Practice Again</span>
							</button>
						</div>
					</article>

					<article className="results-card results-note-card">
						<h2>Evaluation Note</h2>
						<p className="voice-muted">
							This AI feedback is designed for practice and improvement. Use it as a coaching guide,
							not as a final hiring decision.
						</p>
					</article>
				</section>
			</div>
		</main>
	)
}
