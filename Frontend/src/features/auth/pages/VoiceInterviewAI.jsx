import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { useInterview } from "../hooks/useInterview"
import "./VoiceInterview.scss"

function formatClock(totalSeconds) {
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

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

function getCameraErrorMessage(error) {
	if (error?.name === "NotAllowedError") {
		return "Camera permission denied. Allow camera access in browser site settings and try again."
	}
	if (error?.name === "NotFoundError") {
		return "No camera was found. Connect a camera and try again."
	}
	if (error?.name === "NotReadableError") {
		return "Camera is already in use by another app or tab. Close it and retry."
	}
	if (error?.name === "OverconstrainedError") {
		return "The selected camera settings are not supported by this device."
	}
	return error?.message || "Could not access the camera."
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

async function ensureCameraAccess() {
	if (!window.isSecureContext) {
		throw new Error("Camera requires HTTPS or localhost.")
	}
	if (!navigator.mediaDevices?.getUserMedia) {
		throw new Error("Your browser does not support camera access.")
	}
	if (navigator.permissions?.query) {
		try {
			const cameraPermission = await navigator.permissions.query({ name: "camera" })
			if (cameraPermission.state === "denied") {
				throw new Error("Camera permission is blocked in browser settings.")
			}
		} catch {
			// Some browsers do not expose camera permissions queries.
		}
	}
	return navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
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
	const intro = index === 0 ? `Question 1 of ${total}.` : `Question ${index + 1} of ${total}.`
	return `${intro} ${question.question} Answer in one clear example and keep it under 30 seconds.`
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
	const timerRef = useRef(null)
	const cameraStreamRef = useRef(null)
	const cameraVideoRef = useRef(null)
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
	const [elapsedSeconds, setElapsedSeconds] = useState(0)
	const [turnPhase, setTurnPhase] = useState("idle")
	const [cameraStatus, setCameraStatus] = useState("pending")
	const [cameraMessage, setCameraMessage] = useState("Camera preview will appear when the interview is active.")
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
		if (!questions.length || completed) {
			if (timerRef.current) {
				clearInterval(timerRef.current)
				timerRef.current = null
			}
			return undefined
		}

		timerRef.current = setInterval(() => {
			setElapsedSeconds((value) => value + 1)
		}, 1000)

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current)
				timerRef.current = null
			}
		}
	}, [questions.length, completed])

	useEffect(() => {
		if (interviewId && !location.state?.report) {
			reportById(interviewId)
		}
	}, [interviewId, location.state?.report, reportById])

	useEffect(() => {
		let cancelled = false

		async function startCamera() {
			if (!activeReport || !questions.length || completed) return
			if (cameraStreamRef.current) return
			try {
				setCameraStatus("requesting")
				setCameraMessage("Requesting camera access for the live interview...")
				const stream = await ensureCameraAccess()
				if (cancelled) {
					stream.getTracks().forEach((track) => track.stop())
					return
				}
				cameraStreamRef.current = stream
				if (cameraVideoRef.current) {
					cameraVideoRef.current.srcObject = stream
				}
				setCameraStatus("ready")
				setCameraMessage("Camera is live. Keep yourself centered during the interview.")
			} catch (error) {
				if (cancelled) return
				setCameraStatus("blocked")
				setCameraMessage(getCameraErrorMessage(error))
			}
		}

		startCamera()

		return () => {
			cancelled = true
		}
	}, [activeReport, questions.length, completed])

	useEffect(() => {
		return () => {
			if (cameraStreamRef.current) {
				cameraStreamRef.current.getTracks().forEach((track) => track.stop())
				cameraStreamRef.current = null
			}
		}
	}, [])

	useEffect(() => {
		if (!completed || !cameraStreamRef.current) return
		cameraStreamRef.current.getTracks().forEach((track) => track.stop())
		cameraStreamRef.current = null
		setCameraStatus("pending")
		setCameraMessage("Camera stopped for the completed interview.")
	}, [completed])

	useEffect(() => {
		const SpeechRecognition = getSpeechRecognition()
		if (!SpeechRecognition) {
			setStatus("Speech recognition is not supported in this browser.")
			return undefined
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
			setTurnPhase("reviewing")
			setStatus("Answer received. Evaluating...")
			handleAnswer(spoken, activeIndex, question.question)
		}

		recognition.onerror = (event) => {
			if (event?.error === "aborted" && suppressAbortMessageRef.current) {
				suppressAbortMessageRef.current = false
				return
			}
			setIsListening(false)
			setTurnPhase("idle")
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
		if (!questions.length) return undefined
		setCurrentIndex(0)
		setStatus("Starting voice interview")
		setTurnPhase("speaking")
		speakTimerRef.current = setTimeout(() => {
			speakQuestionAt(0)
		}, 500)
		return () => {
			if (speakTimerRef.current) {
				clearTimeout(speakTimerRef.current)
				speakTimerRef.current = null
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
		setTurnPhase("speaking")
		setStatus("Interviewer is speaking...")
		window.speechSynthesis.cancel()
		const utterance = new SpeechSynthesisUtterance(text)
		utterance.rate = 0.95
		utterance.pitch = 1
		utterance.lang = "en-US"
		utterance.onend = () => {
			setTurnPhase("listening")
			startListening()
		}
		window.speechSynthesis.speak(utterance)
	}

	function speakQuestionAt(index) {
		const question = questions[index]
		if (!question) {
			setCompleted(true)
			setStatus("Voice interview completed.")
			setTurnPhase("complete")
			return
		}

		setTurnPhase("speaking")
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
			setTurnPhase("listening")
			setStatus("Listening for your answer...")
			recognition.start()
		} catch (error) {
			setIsListening(false)
			setTurnPhase("idle")
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
		if (!completed) {
			setTurnPhase("idle")
		}
	}

	async function handleAnswer(answerText, questionIndex, questionText) {
		if (processingRef.current || completed) return
		const question = questionsRef.current[questionIndex]
		if (!question) return
		processingRef.current = true
		setTurnPhase("reviewing")
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
				setTurnPhase("idle")
				return
			}

			setFeedback(result.feedback)
			setScore(result.score)
			const numericScore = Number(result.score)
			const isWrongAnswer = Number.isFinite(numericScore) && numericScore <= 4
			const safeFeedback = isWrongAnswer
				? String(result.feedback || "This answer is incorrect.").replace(/on the right track/gi, "incorrect for this question")
				: result.feedback
			const safeFollowUp = isWrongAnswer ? "Let's move to the next question." : result.followUp

			setFeedback(safeFeedback)
			setLastReply(safeFollowUp)
			setStatus(`Score: ${result.score}/10`)

			const transition = buildTurnTransition(safeFeedback, safeFollowUp, interviewerTone)
			const shouldComplete = Boolean(result.isComplete) || questionIndex + 1 >= questionsRef.current.length
			if (shouldComplete) {
				speakText(`${transition} This concludes the interview. Great effort.`)
				setCompleted(true)
				setTurnPhase("complete")
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
			setTurnPhase("complete")
			setStatus("Voice interview completed.")
			stopAllSpeech()
			return
		}
		setCurrentIndex(nextIndex)
		setTurnPhase("speaking")
		scheduleSpeak(() => speakQuestionAt(nextIndex), 300)
	}

	async function finalizeAndViewResults() {
		setIsFinalizingInterview(true)
		try {
			await completeVoiceInterviewSession(interviewId)
			if (cameraStreamRef.current) {
				cameraStreamRef.current.getTracks().forEach((track) => track.stop())
				cameraStreamRef.current = null
			}
			navigate(`/interview/${interviewId}/voice-results`, { state: { report: activeReport } })
		} catch {
			alert("Error finalizing interview. Please try again.")
			setIsFinalizingInterview(false)
		}
	}

	async function retryCameraAccess() {
		if (cameraStreamRef.current) {
			cameraStreamRef.current.getTracks().forEach((track) => track.stop())
			cameraStreamRef.current = null
		}
		setCameraStatus("requesting")
		setCameraMessage("Requesting camera access for the live interview...")
		try {
			const stream = await ensureCameraAccess()
			cameraStreamRef.current = stream
			if (cameraVideoRef.current) {
				cameraVideoRef.current.srcObject = stream
			}
			setCameraStatus("ready")
			setCameraMessage("Camera is live. Keep yourself centered during the interview.")
		} catch (error) {
			setCameraStatus("blocked")
			setCameraMessage(getCameraErrorMessage(error))
		}
	}

	if (!activeReport) {
		return <main className="voice-page"><p>Loading voice interview...</p></main>
	}

	const questionCount = questions.length
	const currentQuestionNumber = questionCount ? Math.min(currentIndex + 1, questionCount) : 0
	const progressPercent = questionCount ? Math.round(((currentIndex + (completed ? 1 : 0)) / questionCount) * 100) : 0
	const upcomingQuestions = questions.slice(currentIndex + 1, currentIndex + 3)
	const stageLabel = {
		speaking: "Interviewer speaking",
		listening: "Your turn to answer",
		reviewing: "Evaluating response",
		complete: "Session complete",
		idle: "Ready"
	}[turnPhase] || "Ready"

	if (completed) {
		return (
			<main className="voice-page">
				<div className="voice-shell">
					<section className="voice-completion-card">
						<div className="completion-header">
							<h1>Voice Interview Completed</h1>
							<p>Great job! You've completed all {questions.length} interview questions.</p>
						</div>

						<div className="completion-stats">
							<div className="stat-item">
								<span className="stat-label">Total Questions</span>
								<span className="stat-value">{answers.length}</span>
							</div>
							<div className="stat-item">
								<span className="stat-label">Latest Score</span>
								<span className="stat-value">
									{score !== null ? `${score}/10` : "Pending"}
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
							<p>Your performance data has been saved. Open the results page for detailed feedback.</p>
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
					<div className="voice-hero-copy">
						<p className="voice-kicker">Voice Interview Mode</p>
						<h1>Live practice for {activeReport.title || `Interview #${interviewId}`}</h1>
						<p className="voice-copy">
							The interviewer speaks one question at a time, waits for your response, and evaluates each answer before moving on to the next turn.
						</p>
						<div className="voice-meta-row">
							<span className={`voice-meta-pill phase-${turnPhase}`}>{stageLabel}</span>
							<span className="voice-meta-pill">Turn {currentQuestionNumber || 1}/{questionCount || 1}</span>
							<span className="voice-meta-pill">Clock {formatClock(elapsedSeconds)}</span>
						</div>
					</div>
					<div className="voice-session-card">
						<div className="voice-session-top">
							<div className="voice-status-row">
								<span className={`voice-dot ${isListening ? "active" : ""}`} />
								<p>{status}</p>
							</div>
							<div className="voice-session-clock">{formatClock(elapsedSeconds)}</div>
						</div>
						<div className="voice-camera-card">
							<div className="voice-card-header">
								<div>
									<p className="voice-card-label">Webcam</p>
									<h3>Camera is part of the session</h3>
								</div>
								<span className={`voice-card-badge camera-${cameraStatus}`}>{cameraStatus === "ready" ? "Allowed" : cameraStatus === "requesting" ? "Requesting" : "Needs access"}</span>
							</div>
							<div className="voice-camera-preview-wrap">
								<video ref={cameraVideoRef} className="voice-camera-preview" autoPlay playsInline muted />
								<div className="voice-camera-overlay">
									<p>{cameraMessage}</p>
									{cameraStatus !== "ready" ? (
										<button type="button" className="voice-btn ghost" onClick={retryCameraAccess}>Allow camera</button>
									) : null}
								</div>
							</div>
						</div>
						<div className="voice-progress-track" aria-hidden="true">
							<div className="voice-progress-fill" style={{ width: `${progressPercent}%` }} />
						</div>
						<div className="voice-session-mini-grid">
							<div>
								<span>Question</span>
								<strong>{currentQuestionNumber || 1}/{questionCount || 1}</strong>
							</div>
							<div>
								<span>Mode</span>
								<strong>{interviewerTone}</strong>
							</div>
							<div>
								<span>Transcript</span>
								<strong>{transcript ? "Captured" : "Waiting"}</strong>
							</div>
						</div>
						<div className="voice-actions compact">
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
							<button type="button" className="voice-btn ghost" onClick={nextQuestion}>Skip ahead</button>
							<button type="button" className="voice-btn ghost" onClick={() => navigate(`/interview/${interviewId}`)}>Exit mode</button>
						</div>
					</div>
				</header>

				<section className="voice-panel">
					<div className="voice-conversation-grid">
						<article className="voice-question-card voice-conversation-card interviewer-card">
							<div className="voice-card-header">
								<div>
									<p className="voice-card-label">Interviewer</p>
									<h2>Real-time question delivery</h2>
								</div>
								<span className={`voice-card-badge phase-${turnPhase}`}>{stageLabel}</span>
							</div>
							<div className="voice-bubble interviewer-bubble">
								<p>{currentQuestion?.question || "All questions completed"}</p>
							</div>
							<div className="voice-question-meta">
								<span>Question {currentQuestionNumber || 0} of {questionCount || 0}</span>
								<span>{currentQuestion?.type || "Complete"}</span>
							</div>
							{currentQuestion?.followUp ? <p className="voice-hint">Interviewer focus: {currentQuestion.followUp}</p> : null}
						</article>

						<article className="voice-answer-card voice-conversation-card candidate-card">
							<div className="voice-card-header">
								<div>
									<p className="voice-card-label">Candidate</p>
									<h3>Live answer capture</h3>
								</div>
								<span className="voice-card-badge live">{isListening ? "Recording" : "Waiting"}</span>
							</div>
							<div className="voice-bubble candidate-bubble">
								<p>{transcript || "Your spoken answer will appear here."}</p>
							</div>
							<div className="voice-answer-foot">
								<span>{isListening ? "Mic open" : "Mic closed"}</span>
								<span>{transcript ? `${transcript.split(/\s+/).filter(Boolean).length} words captured` : "Ready to answer"}</span>
							</div>
						</article>

						<article className="voice-answer-card voice-conversation-card review-card">
							<div className="voice-card-header">
								<div>
									<p className="voice-card-label">AI Reviewer</p>
									<h3>Response scoring</h3>
								</div>
								<span className="voice-card-badge score-badge">{score !== null ? `${score}/10` : "Pending"}</span>
							</div>
							<div className="voice-bubble review-bubble">
								<p>{feedback}</p>
							</div>
							{lastReply ? <p className="voice-reply">Interviewer follow-up: {lastReply}</p> : null}
						</article>

						<aside className="voice-history voice-conversation-card queue-card">
							<div className="voice-card-header">
								<div>
									<p className="voice-card-label">Next Up</p>
									<h3>Interview queue</h3>
								</div>
								<span className="voice-card-badge">{answers.length}/{questionCount || 0}</span>
							</div>
							{upcomingQuestions.length === 0 ? (
								<p className="voice-muted">No more queued questions after this turn.</p>
							) : (
								upcomingQuestions.map((item, index) => (
									<div key={`${item.type}-${index}`} className="voice-history-item">
										<strong>{currentIndex + index + 2}.</strong>
										<span>{item.question}</span>
									</div>
								))
							)}
						</aside>
					</div>
				</section>
			</div>
		</main>
	)
}