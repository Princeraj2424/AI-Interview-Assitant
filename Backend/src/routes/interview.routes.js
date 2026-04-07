const express = require("express")
const authMiddleware = require("../Middleware/auth.middleware")
const interviewController = require("../controllers/interviewer.controller")
const { uploadResume } = require("../Middleware/file.middleware")

const interviewRouter = express.Router()
/**
 * @route post /api/interview/report
 * @description: generate interview report
 * @access private
 */
interviewRouter.post("/", authMiddleware.authUser, uploadResume, interviewController.generateInterviewReportController)
/**
 * @route get /api/interview/report/:interviewId
 * @description: get interview report by id
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)

/**
 * @route get /api/interview/report/:interviewId/resume
 * @description: download suggested resume as PDF for a given interview report ID
 * @access private
 * @returns PDF file containing the suggested resume based on the interview report
 */
interviewRouter.get("/report/:interviewId/resume", authMiddleware.authUser, interviewController.generateSuggestedResumePdfController)

/**
 * @route post /api/interview/report/:interviewId/voice-turn
 * @description evaluate spoken answer and provide the next interviewer response
 * @access private
 */
interviewRouter.post("/report/:interviewId/voice-turn", authMiddleware.authUser, interviewController.evaluateVoiceInterviewTurnController)

/**
 * @route post /api/interview/report/:interviewId/voice-complete
 * @description complete voice interview and calculate overall performance
 * @access private
 */
interviewRouter.post("/report/:interviewId/voice-complete", authMiddleware.authUser, interviewController.completeVoiceInterviewController)

/**
 * @route get /api/interview/report/:interviewId/voice-feedback
 * @description get voice interview feedback and performance results
 * @access private
 */
interviewRouter.get("/report/:interviewId/voice-feedback", authMiddleware.authUser, interviewController.getVoiceInterviewFeedbackController)

/**
 * @decs get all interview reports for the authenticated user
 * @route get /api/interview/reports
 * @access private
 */
interviewRouter.get("/reports", authMiddleware.authUser, interviewController.getAllInterviewReportsController)

module.exports = interviewRouter