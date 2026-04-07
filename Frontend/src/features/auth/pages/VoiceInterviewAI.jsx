import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { useInterview } from "../hooks/useInterview"
import "./VoiceInterview.scss"

function getSpeechRecognition() {
	return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

function getSpeechErrorMessage(event) {
	const errorCode = event?.error
	if (errorCode === "not-allowed" || errorCode === "service-not-allowed") {
		return "Microphone permission denied. Allow microphone access in browser site settings and try again."
	}
	if (errorCode === "no-speech") {
		return "No speech detected. Speak clearly after tapping Start listening, then try again."
	}
	if (errorCode === "audio-capture") {
		return "No microphone was found. Connect a microphone and try again."
	}
	if (errorCode === "language-not-supported") {
		return "Speech recognition language is not supported in this browser."
	}
	if (errorCode === "bad-grammar") {
		return "Speech recognition could not parse audio input. Please retry."
	}
	if (errorCode === "network") {
		return "Speech service network issue. Check internet connection and retry."
	}
	if (errorCode === "aborted") {
		return "Listening stopped before completion. Tap Start listening to retry."
	}
	return `Microphone error (${errorCode || "unknown"}). Please retry after checking permissions.`
}

async function ensureMicrophoneAccess() {
	if (!window.isSecureContext) {
		throw new Error("Microphone requires HTTPS or localhost.")
	}
	if (!navigator.mediaDevices?.getUserMedia) {
		throw new Error("Your browser does not support microphone access.")
	}
	if (navigator.permissions?.query) {
		const micPermission = await navigator.permissions.query({ name: "microphone" })
		if (micPermission.state === "denied") {
			throw new Error("Microphone permission is blocked in browser settings.")
		}
	}
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
	stream.getTracks().forEach((track) => track.stop())
}

function speakText(text) {
	if (!window.speechSynthesis) return
	window.speechSynthesis.cancel()
	const utterance = new SpeechSynthesisUtterance(text)
	utterance.rate = 0.95
	utterance.pitch = 1
	utterance.lang = "en-US"
	window.speechSynthesis.speak(utterance)
	return utterance
}

function buildQuestionQueue(report) {
	const technical = (report?.technicalQuestions || []).slice(0, 3).map((item) => ({
		type: "Technical",
		question: item.question,
		followUp: item.answer
	}))

	const behavioral = (report?.behavioralQuestions || []).slice(0, 2).map((item) => ({
		type: "Behavioral",
		question: item.question,
		followUp: item.answer
	}))

	return [...technical, ...behavioral]
}

function buildQuestionPrompt(question, index, total, tone) {
	if (!question?.question) return ""
	if (tone === "strict") {
		if (index === 0) {
			return `Interview starts now. Question 1 of ${total}. ${question.question}`
		}
		return `Next. Question ${index + 1} of ${total}. ${question.question}`
	}
	if (tone === "faang") {
		if (index === 0) {
			return `Welcome. We'll run a structured interview focused on clarity and depth. Question 1 of ${total}. ${question.question}`
		}
		return `Let's continue. Question ${index + 1} of ${total}. Please think out loud where helpful. ${question.question}`
	}
	if (index === 0) {
		return `Welcome. Thanks for joining. Let's begin. ${question.question}`
	}
	return `Thanks. Let's move to question ${index + 1} of ${total}. ${question.question}`
}

function buildTurnTransition(feedback, followUp, tone) {
	const safeFeedback = feedback || "Good attempt."
	const safeFollowUp = followUp || "Thanks for your response."
	if (tone === "strict") {
		return `${safeFeedback}. ${safeFollowUp}`
	}
	if (tone === "faang") {
		return `${safeFeedback}. ${safeFollowUp} Try to be precise and use one concrete example.`
	}
	return `${safeFeedback}. ${safeFollowUp}`
}

export default function VoiceInterviewAI() {
	const { interviewId } = useParams()
	const location = useLocation()
	const navigate = useNavigate()
	const { report, reportById, evaluateVoiceTurn, completeVoiceInterviewSession } = useInterview()
	const recognitionRef = useRef(null)
	const processingRef = useRef(false)
	const speakTimerRef = useRef(null)
	const currentIndexRef = useRef(0)
	const questionsRef = useRef([])
	const recognitionActiveRef = useRef(false)
	const suppressAbortMessageRef = useRef(false)

	const activeReport = location.state?.report || report
	const questions = useMemo(() => buildQuestionQueue(activeReport), [activeReport])

	const [currentIndex, setCurrentIndex] = useState(0)
	const [isListening, setIsListening] = useState(false)
	const [transcript, setTranscript] = useState("")
	const [answers, setAnswers] = useState([])
	const [status, setStatus] = useState("Ready to start")
	const [feedback, setFeedback] = useState("Your evaluated feedback will appear here.")
	const [score, setScore] = useState(null)
	const [completed, setCompleted] = useState(false)
	const [lastReply, setLastReply] = useState("")
	const [isFinalizingInterview, setIsFinalizingInterview] = useState(false)
	const [interviewerTone, setInterviewerTone] = useState(() => {
		try {
			return localStorage.getItem("interviewerTone") || "friendly"
		} catch {
			return "friendly"
		}
	})

	useEffect(() => {
		try {
			localStorage.setItem("interviewerTone", interviewerTone)
		} catch {
			// Ignore storage errors in restricted environments.
		}
	}, [interviewerTone])

	useEffect(() => {
		currentIndexRef.current = currentIndex
	}, [currentIndex])

	useEffect(() => {
		questionsRef.current = questions
	}, [questions])

	useEffect(() => {
		if (interviewId && !location.state?.report) {
			reportById(interviewId)
		}
	}, [interviewId, location.state?.report, reportById])

	useEffect(() => {
		const SpeechRecognition = getSpeechRecognition()
		if (!SpeechRecognition) {
			setStatus("Speech recognition is not supported in this browser.")
			return
		}

		const recognition = new SpeechRecognition()
		recognition.lang = "en-US"
		recognition.interimResults = false
		recognition.continuous = false
		recognition.maxAlternatives = 1
		recognition.onstart = () => {
			recognitionActiveRef.current = true
		}

		recognition.onresult = (event) => {
			const activeIndex = currentIndexRef.current
			const question = questionsRef.current[activeIndex]
			if (!question || processingRef.current) return

			const spoken = event.results?.[0]?.[0]?.transcript || ""
			setTranscript(spoken)
			setAnswers((prev) => {
				const updated = [...prev]
				updated[activeIndex] = spoken
				return updated
			})
			setIsListening(false)
			setStatus("Answer received. Evaluating...")
			handleAnswer(spoken, activeIndex, question.question)
		}

		recognition.onerror = (event) => {
			if (event?.error === "aborted" && suppressAbortMessageRef.current) {
				suppressAbortMessageRef.current = false
				return
			}
			setIsListening(false)
			setStatus(getSpeechErrorMessage(event))
		}

		recognition.onend = () => {
			recognitionActiveRef.current = false
			setIsListening(false)
		}

		recognitionRef.current = recognition

		return () => {
			recognitionActiveRef.current = false
			recognition.stop()
			window.speechSynthesis?.cancel()
		}
	}, [])

	useEffect(() => {
		if (!questions.length) return
		setCurrentIndex(0)
		setStatus("Starting voice interview")
		speakTimerRef.current = setTimeout(() => {
			speakQuestionAt(0)
		}, 500)
		return () => {
			if (speakTimerRef.current) {
				clearTimeout(speakTimerRef.current)
				speakTimerRef.current = null
			}
		}
	}, [questions.length])

	const currentQuestion = questions[currentIndex]

	function clearSpeakTimer() {
		if (speakTimerRef.current) {
			clearTimeout(speakTimerRef.current)
			speakTimerRef.current = null
		}
	}

	function scheduleSpeak(fn, delay) {
		clearSpeakTimer()
		speakTimerRef.current = setTimeout(() => {
			speakTimerRef.current = null
			fn()
		}, delay)
	}

	function speakAndListen(text) {
		if (!text) return
		window.speechSynthesis.cancel()
		const utterance = new SpeechSynthesisUtterance(text)
		utterance.rate = 0.95
		utterance.pitch = 1
		utterance.lang = "en-US"
		utterance.onend = () => {
			startListening()
		}
		window.speechSynthesis.speak(utterance)
	}

	function speakQuestionAt(index) {
		const question = questions[index]
		if (!question) {
			setCompleted(true)
			setStatus("Voice interview completed.")
			return
		}

		setStatus(`Question ${index + 1} of ${questions.length}`)
		speakAndListen(buildQuestionPrompt(question, index, questions.length, interviewerTone))
	}

	async function startListening() {
		const recognition = recognitionRef.current
		if (!recognition || completed || processingRef.current || recognitionActiveRef.current) return
		try {
			await ensureMicrophoneAccess()
			setTranscript("")
			setIsListening(true)
			setStatus("Listening for your answer...")
			recognition.start()
		} catch (error) {
			setIsListening(false)
			setStatus(error?.message || "Could not start microphone.")
		}
	}

	function stopAllSpeech() {
		clearSpeakTimer()
		if (recognitionActiveRef.current && recognitionRef.current) {
			suppressAbortMessageRef.current = true
			recognitionRef.current.stop()
		}
		window.speechSynthesis?.cancel()
		setIsListening(false)
	}

	async function handleAnswer(answerText, questionIndex, questionText) {
		if (processingRef.current || completed) return
		const question = questionsRef.current[questionIndex]
		if (!question) return
		processingRef.current = true
		try {
			const result = await evaluateVoiceTurn({
				interviewId,
				answer: answerText,
				questionIndex,
				currentQuestion: questionText
			})

			if (!result) {
				setFeedback("Unable to evaluate this response right now.")
				setStatus("Evaluation failed.")
				return
			}

			setFeedback(result.feedback)
			setScore(result.score)
			setLastReply(result.followUp)
			setStatus(`Score: ${result.score}/10`)

			const transition = buildTurnTransition(result.feedback, result.followUp, interviewerTone)

			const shouldComplete = Boolean(result.isComplete) || questionIndex + 1 >= questionsRef.current.length
			if (shouldComplete) {
				speakText(`${transition} This concludes the interview. Great effort.`)
				setCompleted(true)
				return
			}

			const nextIndex = questionIndex + 1
			const nextQuestion = questionsRef.current[nextIndex]
			setCurrentIndex(nextIndex)
			scheduleSpeak(() => {
				const nextPrompt = buildQuestionPrompt(nextQuestion, nextIndex, questionsRef.current.length, interviewerTone)
				speakAndListen(`${transition} ${nextPrompt}`)
			}, 650)
		} finally {
			processingRef.current = false
		}
	}

	function replayQuestion() {
		stopAllSpeech()
		scheduleSpeak(() => speakQuestionAt(currentIndex), 250)
	}

	function nextQuestion() {
		if (!currentQuestion || completed) return
		const nextIndex = currentIndex + 1
		if (nextIndex >= questions.length) {
			setCompleted(true)
			setStatus("Voice interview completed.")
			stopAllSpeech()
			return
		}
		setCurrentIndex(nextIndex)
		scheduleSpeak(() => speakQuestionAt(nextIndex), 300)
	}

	async function finalizeAndViewResults() {
		setIsFinalizingInterview(true)
		try {
			await completeVoiceInterviewSession(interviewId)
			// Navigate to results page
			navigate(`/interview/${interviewId}/voice-results`, { state: { report: activeReport } })
		} catch {
			alert("Error finalizing interview. Please try again.")
			setIsFinalizingInterview(false)
		}
	}

	if (!activeReport) {
		return <main className="voice-page"><p>Loading voice interview...</p></main>
	}

	// Show completion screen
	if (completed) {
		return (
			<main className="voice-page">
				<div className="voice-shell">
					<section className="voice-completion-card">
						<div className="completion-header">
							<h1>🎉 Voice Interview Completed!</h1>
							<p>Great job! You've completed all {questions.length} interview questions.</p>
						</div>

						<div className="completion-stats">
							<div className="stat-item">
								<span className="stat-label">Total Questions</span>
								<span className="stat-value">{answers.length}</span>
							</div>
							<div className="stat-item">
								<span className="stat-label">Average Score</span>
								<span className="stat-value">
									{score !== null ? `${score}/10 (last turn)` : "Calculated in results page"}
								</span>
							</div>
						</div>

						<div className="completion-actions">
							<button
								type="button"
								className="completion-btn primary"
								onClick={finalizeAndViewResults}
								disabled={isFinalizingInterview}
							>
								{isFinalizingInterview ? "Finalizing..." : "View Performance Results"}
							</button>
							<button
								type="button"
								className="completion-btn secondary"
								onClick={() => navigate(`/interview/${interviewId}`)}
							>
								Back to Report
							</button>
							<button
								type="button"
								className="completion-btn ghost"
								onClick={() => navigate("/home")}
							>
								Go to Dashboard
							</button>
						</div>

						<div className="completion-note">
							<p>💡 Your performance data has been saved. View detailed feedback on the next page.</p>
						</div>
					</section>
				</div>
			</main>
		)
	}

	return (
		<main className="voice-page">
			<div className="voice-shell">
				<header className="voice-hero">
					<div>
						<p className="voice-kicker">Voice Interview Mode</p>
						<h1>Live practice for {activeReport.title || `Interview #${interviewId}`}</h1>
						<p className="voice-copy">
							The system speaks each question, records your voice answer, and uses AI to evaluate your response before moving to the next turn.
						</p>
					</div>
					<div className="voice-actions">
						<select
							className="voice-tone-select"
							value={interviewerTone}
							onChange={(e) => setInterviewerTone(e.target.value)}
						>
							<option value="friendly">Friendly Tone</option>
							<option value="strict">Strict Tone</option>
							<option value="faang">FAANG Style</option>
						</select>
						<Link to={`/interview/${interviewId}`} className="voice-link">Back to report</Link>
						<button type="button" className="voice-btn secondary" onClick={replayQuestion}>Repeat question</button>
						<button type="button" className="voice-btn primary" onClick={isListening ? stopAllSpeech : startListening}>
							{isListening ? "Stop listening" : "Start listening"}
						</button>
						<button type="button" className="voice-btn ghost" onClick={nextQuestion}>Next question</button>
						<button type="button" className="voice-btn ghost" onClick={() => navigate(`/interview/${interviewId}`)}>Exit mode</button>
					</div>
				</header>

				<section className="voice-panel">
					<div className="voice-status-row">
						<span className={`voice-dot ${isListening ? "active" : ""}`} />
						<p>{status}</p>
					</div>

					<div className="voice-question-card">
						<div className="voice-question-meta">
							<span>Question {Math.min(currentIndex + 1, questions.length)} of {questions.length}</span>
							<span>{currentQuestion?.type || "Complete"}</span>
						</div>
						<h2>{currentQuestion?.question || "All questions completed"}</h2>
						{currentQuestion?.followUp ? <p className="voice-hint">Expected direction: {currentQuestion.followUp}</p> : null}
					</div>

					<div className="voice-answer-card">
						<h3>Your Answer</h3>
						<p>{transcript || "Your spoken answer will appear here."}</p>
					</div>

					<div className="voice-answer-card">
						<h3>AI Feedback</h3>
						<p>{feedback}</p>
						{score !== null ? <p style={{ marginTop: "0.5rem" }}>Score: {score}/10</p> : null}
						{lastReply ? <p style={{ marginTop: "0.5rem" }}>Interviewer: {lastReply}</p> : null}
					</div>

					<div className="voice-history">
						<h3>Captured Answers</h3>
						{answers.length === 0 ? (
							<p className="voice-muted">No answers captured yet.</p>
						) : (
							answers.map((answer, index) => (
								<div key={index} className="voice-history-item">
									<strong>Q{index + 1}:</strong>
									<span>{answer}</span>
								</div>
							))
						)}
					</div>
				</section>
			</div>
		</main>
	)
}
