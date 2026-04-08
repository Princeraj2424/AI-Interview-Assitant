const { PDFParse } = require("pdf-parse")
const { generateInterviewReport, generateTailoredResumeData, generateVoiceInterviewTurn, reconcileRoleFitScore } = require("../services/ai.service")
const InterviewReportModel = require("../models/interviewReport.model")
const { renderResumePdf } = require("../services/resumePdf.service")

function buildReportTitle(jobDescription = "") {
    const firstLine = String(jobDescription).split("\n")[0].trim()
    if (!firstLine) {
        return "Interview Report"
    }
    return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine
}

async function extractResumeTextFromPdf(fileBuffer) {
    const parser = new PDFParse({ data: fileBuffer })
    try {
        const parsed = await parser.getText()
        if (typeof parsed === "string") {
            return parsed
        }
        return parsed?.text || ""
    } finally {
        if (typeof parser.destroy === "function") {
            await parser.destroy()
        }
    }
}

/**
 *@generte interview report controller
 *@route POST/api/interview
 *@access private
 */
async function generateInterviewReportController(req, res){
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Resume file is required" })
        }

        const { jobDescription, selfDescription } = req.body
        if (!jobDescription || !String(jobDescription).trim()) {
            return res.status(400).json({ success: false, message: "Job description is required" })
        }

        const resumeText = await extractResumeTextFromPdf(req.file.buffer)
        if (!resumeText.trim()) {
            return res.status(400).json({ success: false, message: "Could not read text from the uploaded PDF" })
        }

        const interviewReportByAi = await generateInterviewReport(
            jobDescription,
            resumeText,
            selfDescription
        )

        const userId = req.user?._id || req.user?.id
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized user" })
        }

        const interviewReport = await InterviewReportModel.create({
            ...interviewReportByAi,
            jobDescription,
            selfDescription,
            resume: resumeText,
            title: interviewReportByAi?.title || buildReportTitle(jobDescription),
            user: userId
        })

        res.status(201).json({ success: true, data: interviewReport })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

/** 
 * @decs Get interview report by ID
 * @GET /api/interview/:id
 * @access private
 */
async function getInterviewReportByIdController(req, res){
    try {
        const { interviewId } = req.params
        const userId = req.user?._id || req.user?.id
        const interviewReport = await InterviewReportModel.findOne({_id:interviewId, user: userId})
        if(!interviewReport){
            return res.status(404).json({ success: false, message: "interview report not found" })
        }
        res.status(200).json({ success: true, data: interviewReport, message: "interview report fetched successfully" })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @decs Get all interview reports for the authenticated user
 * @GET /api/interview
 * @access private
 */
async function getAllInterviewReportsController(req ,res){
    try {
        const userId = req.user?._id || req.user?.id
        const interviewReports = await InterviewReportModel.find({ user: userId}).sort({ createdAt: -1}).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -preparationPlan -skillGaps")
        res.status(200).json({ success: true, data: interviewReports, message: "interview reports fetched successfully" })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @desc Generate tailored resume PDF based on interview performance
 * @route GET /api/interview/report/:interviewId/resume
 * @access private
 */
async function generateSuggestedResumePdfController(req, res) {
    try {
        const { interviewId } = req.params
        const userId = req.user?._id || req.user?.id

        const interviewReport = await InterviewReportModel.findOne({ _id: interviewId, user: userId })
        if (!interviewReport) {
            return res.status(404).json({ success: false, message: "interview report not found" })
        }

        const resumeData = await generateTailoredResumeData({
            report: interviewReport,
            jobDescription: interviewReport.jobDescription,
            resume: interviewReport.resume,
            selfDescription: interviewReport.selfDescription,
            voiceInterviewTurns: interviewReport.voiceInterviewTurns || [],
            performanceScore: interviewReport.overallPerformanceScore
        })

        const candidateName = req.user?.name || req.user?.fullName || req.user?.username || "Candidate"
        const pdfBuffer = await renderResumePdf({
            candidateName,
            score: interviewReport.matchScore,
            data: resumeData
        })

        res.setHeader("Content-Type", "application/pdf")
        res.setHeader("Content-Disposition", `attachment; filename="ai_resume_${interviewId}.pdf"`)
        return res.status(200).send(pdfBuffer)
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @desc Evaluate a spoken answer and return interviewer feedback plus the next prompt
 * @route POST /api/interview/report/:interviewId/voice-turn
 * @access private
 */
async function evaluateVoiceInterviewTurnController(req, res) {
    try {
        const { interviewId } = req.params
        const { answer, questionIndex, currentQuestion } = req.body
        const userId = req.user?._id || req.user?.id

        if (!answer || !String(answer).trim()) {
            return res.status(400).json({ success: false, message: "Answer is required" })
        }

        const interviewReport = await InterviewReportModel.findOne({ _id: interviewId, user: userId })
        if (!interviewReport) {
            return res.status(404).json({ success: false, message: "interview report not found" })
        }

        const technicalCount = (interviewReport.technicalQuestions || []).length
        const totalQuestions = Math.min(3, technicalCount) + Math.min(2, (interviewReport.behavioralQuestions || []).length)

        const questions = [
            ...(interviewReport.technicalQuestions || []).slice(0, 3).map((item) => ({ question: item.question, type: "Technical" })),
            ...(interviewReport.behavioralQuestions || []).slice(0, 2).map((item) => ({ question: item.question, type: "Behavioral" }))
        ]

        const parsedIndex = Number(questionIndex)
        const safeIndex = Number.isFinite(parsedIndex) && parsedIndex >= 0 ? parsedIndex : 0
        const questionObj = questions[safeIndex]
        const activeQuestion = currentQuestion || questionObj?.question || "Tell me about yourself."
        const questionType = questionObj?.type || "Technical"

        const evaluation = await generateVoiceInterviewTurn({
            report: interviewReport,
            currentQuestion: activeQuestion,
            answer: String(answer),
            questionIndex: safeIndex,
            totalQuestions: totalQuestions || 1
        })

        // Mark voice interview as started if not already
        if (!interviewReport.voiceInterviewStarted) {
            interviewReport.voiceInterviewStarted = true
        }

        // Save this turn to the database
        interviewReport.voiceInterviewTurns.push({
            questionIndex: safeIndex,
            question: activeQuestion,
            questionType: questionType,
            userAnswer: String(answer),
            feedback: evaluation.feedback,
            score: evaluation.score
        })

        await interviewReport.save()

        return res.status(200).json({
            success: true,
            data: {
                ...evaluation,
                questionIndex: safeIndex,
                currentQuestion: activeQuestion,
                questionType: questionType,
                totalQuestions: totalQuestions || 1
            }
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @desc Complete voice interview and calculate overall performance
 * @route POST /api/interview/report/:interviewId/voice-complete
 * @access private
 */
async function completeVoiceInterviewController(req, res) {
    try {
        const { interviewId } = req.params
        const userId = req.user?._id || req.user?.id

        const interviewReport = await InterviewReportModel.findOne({ _id: interviewId, user: userId })
        if (!interviewReport) {
            return res.status(404).json({ success: false, message: "interview report not found" })
        }

        if (!interviewReport.voiceInterviewTurns || interviewReport.voiceInterviewTurns.length === 0) {
            return res.status(400).json({ success: false, message: "No voice interview turns recorded" })
        }

        // Calculate overall performance score
        const totalScore = interviewReport.voiceInterviewTurns.reduce((sum, turn) => sum + turn.score, 0)
        const averageScore = totalScore / interviewReport.voiceInterviewTurns.length

        interviewReport.voiceInterviewCompleted = true
        interviewReport.overallPerformanceScore = Math.round(averageScore * 10) / 10
        interviewReport.voiceInterviewCompletedAt = new Date()

        await interviewReport.save()

        return res.status(200).json({
            success: true,
            data: {
                _id: interviewReport._id,
                voiceInterviewCompleted: true,
                overallPerformanceScore: interviewReport.overallPerformanceScore,
                totalTurns: interviewReport.voiceInterviewTurns.length,
                completedAt: interviewReport.voiceInterviewCompletedAt
            },
            message: "Voice interview completed successfully"
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

/**
 * @desc Get voice interview feedback and performance results
 * @route GET /api/interview/report/:interviewId/voice-feedback
 * @access private
 */
async function getVoiceInterviewFeedbackController(req, res) {
    try {
        const { interviewId } = req.params
        const userId = req.user?._id || req.user?.id

        const interviewReport = await InterviewReportModel.findOne({ _id: interviewId, user: userId })
        if (!interviewReport) {
            return res.status(404).json({ success: false, message: "interview report not found" })
        }

        if (!interviewReport.voiceInterviewCompleted) {
            return res.status(400).json({ success: false, message: "Voice interview not completed yet" })
        }

        // Compile feedback and performance data
        const roleFitScore = reconcileRoleFitScore({
            aiScore: interviewReport.matchScore,
            jobDescription: interviewReport.jobDescription,
            resume: interviewReport.resume,
            selfDescription: interviewReport.selfDescription
        })

        const performanceData = {
            _id: interviewReport._id,
            title: interviewReport.title,
            matchScore: roleFitScore,
            overallPerformanceScore: interviewReport.overallPerformanceScore,
            voiceInterviewCompleted: interviewReport.voiceInterviewCompleted,
            totalTurns: interviewReport.voiceInterviewTurns.length,
            voiceInterviewCompletedAt: interviewReport.voiceInterviewCompletedAt,
            turns: interviewReport.voiceInterviewTurns.map((turn, index) => ({
                questionIndex: turn.questionIndex,
                questionType: turn.questionType,
                question: turn.question,
                userAnswer: turn.userAnswer,
                feedback: turn.feedback,
                score: turn.score,
                scorePercentage: Math.round((turn.score / 10) * 100)
            })),
            strengthAreas: [],
            improvementAreas: []
        }

        // Analyze turns for strengths and improvements
        const technicalTurns = performanceData.turns.filter(t => t.questionType === "Technical")
        const behavioralTurns = performanceData.turns.filter(t => t.questionType === "Behavioral")

        if (technicalTurns.length > 0) {
            const techAvg = technicalTurns.reduce((sum, t) => sum + t.score, 0) / technicalTurns.length
            if (techAvg >= 7) {
                performanceData.strengthAreas.push("Strong technical knowledge")
            } else {
                performanceData.improvementAreas.push("Technical depth and clarity")
            }
        }

        if (behavioralTurns.length > 0) {
            const behavAvg = behavioralTurns.reduce((sum, t) => sum + t.score, 0) / behavioralTurns.length
            if (behavAvg >= 7) {
                performanceData.strengthAreas.push("Excellent communication skills")
            } else {
                performanceData.improvementAreas.push("Behavior and communication")
            }
        }

        if (performanceData.overallPerformanceScore >= 8) {
            performanceData.strengthAreas.push("Outstanding interview readiness")
        } else if (performanceData.overallPerformanceScore >= 6) {
            performanceData.improvementAreas.push("Overall interview confidence")
        }

        return res.status(200).json({
            success: true,
            data: performanceData,
            message: "Voice interview feedback retrieved successfully"
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}



module.exports = {
    generateInterviewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateSuggestedResumePdfController,
    evaluateVoiceInterviewTurnController,
    completeVoiceInterviewController,
    getVoiceInterviewFeedbackController
}