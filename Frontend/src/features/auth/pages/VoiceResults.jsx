import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useInterview } from "../hooks/useInterview"
import "./VoiceInterview.scss"

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

	useEffect(() => {
		async function fetchFeedback() {
			try {
				setLoading(true)
				const data = await getVoiceFeedback(interviewId)
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

	const performanceScore = feedbackData.overallPerformanceScore
	const performanceLabel = getPerformanceLabel(performanceScore)
	const performanceColor = getPerformanceColor(performanceScore)
	const performancePercentage = Math.round((performanceScore / 10) * 100)

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
								<span className="label">Application Match Score</span>
								<span className="value">{feedbackData.matchScore}/100</span>
							</div>
							<div className="analysis-item">
								<span className="label">Interview Performance</span>
								<span className="value">{Math.round(performanceScore * 10)}%</span>
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

					{/* Turn-by-Turn Breakdown */}
					<article className="results-card">
						<h2>Question-by-Question Breakdown</h2>
						<div className="turns-grid">
							{feedbackData.turns.map((turn, index) => (
								<div key={index} className="turn-card">
									<div className="turn-header">
										<span className="turn-number">Q{turn.questionIndex + 1}</span>
										<span className={`turn-type ${turn.questionType.toLowerCase()}`}>
											{turn.questionType}
										</span>
										<span className="turn-score">{turn.score}/10</span>
									</div>
									<div className="turn-content">
										<div className="turn-question">
											<strong>Question:</strong>
											<p>{turn.question}</p>
										</div>
										<div className="turn-answer">
											<strong>Your Answer:</strong>
											<p>{turn.userAnswer}</p>
										</div>
										<div className="turn-feedback">
											<strong>Feedback:</strong>
											<p>{turn.feedback}</p>
										</div>
									</div>
									<div className="turn-score-meter">
										<div className="meter-fill" style={{ width: `${(turn.score / 10) * 100}%` }} />
									</div>
								</div>
							))}
						</div>
					</article>

					{/* Download Options */}
					<article className="results-card actions-card">
						<h2>Next Steps</h2>
						<div className="actions-grid">
								<button className="action-option" onClick={() => downloadSuggestedResume(interviewId)}>
								<span className="action-icon">📄</span>
									<span className="action-text">Download AI Resume</span>
							</button>
							<button className="action-option" onClick={() => navigate(`/interview/${interviewId}`)}>
								<span className="action-icon">📋</span>
								<span className="action-text">View Full Interview Report</span>
							</button>
							<button className="action-option" onClick={() => navigate("/home")}>
								<span className="action-icon">🏠</span>
								<span className="action-text">Return to Dashboard</span>
							</button>
							<button className="action-option">
								<span className="action-icon">🔄</span>
								<span className="action-text">Practice Again</span>
							</button>
						</div>
					</article>
				</section>
			</div>
		</main>
	)
}
