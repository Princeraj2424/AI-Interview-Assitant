const resume = `
Full-stack developer with 2 years of experience building MERN applications,
REST APIs, and authentication flows. Comfortable with React, Node.js,
Express, MongoDB, and integrating third-party services.
`

const selfDescription = `
I am a detail-oriented developer who enjoys building user-facing products and
making backend systems reliable, secure, and easy to maintain.
`

const jobDescription = `
Looking for a full-stack engineer to build AI-assisted interview tools using
React, Node.js, Express, MongoDB, and external AI APIs.
`

const sampleInterviewReport = {
	jobDescription,
	resume,
	selfDescription,
	matchScore: 84,
	technicalQuestions: [
		{
			question: "How would you design a secure auth flow for a MERN app?",
			intention: "Assess backend security and session handling knowledge.",
			answer: "Use hashed passwords, JWT or secure sessions, HTTP-only cookies, input validation, rate limiting, and token blacklist handling for logout."
		},
		{
			question: "How do you structure an API integration with an AI service?",
			intention: "Check external API integration experience.",
			answer: "Keep API keys on the server, wrap calls in a service layer, handle retries and errors cleanly, and return normalized responses to the frontend."
		}
	],
	behavioralQuestions: [
		{
			question: "Tell me about a time you had to fix a production issue quickly.",
			intention: "Assess ownership and incident response.",
			answer: "I isolated the failing dependency, rolled out a minimal patch, verified the fix in staging, and documented the root cause for the team."
		}
	],
	skillGaps: [
		{
			skill: "advanced system design",
			severity: "medium"
		},
		{
			skill: "LLM prompt evaluation",
			severity: "low"
		}
	],
	preparationPlan: [
		{
			day: 1,
			focus: "Authentication fundamentals",
			tasks: "Review JWT, cookie security, password hashing, and common auth edge cases."
		},
		{
			day: 2,
			focus: "API integration patterns",
			tasks: "Practice building service wrappers around external APIs with error handling and logging."
		},
		{
			day: 3,
			focus: "Behavioral prep",
			tasks: "Prepare concise STAR answers for ownership, conflict resolution, and debugging examples."
		}
	]
}

module.exports = {
	sampleInterviewReport,
	jobDescription,
	resume,
	selfDescription
}