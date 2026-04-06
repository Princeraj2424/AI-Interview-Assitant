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
module.exports = interviewRouter