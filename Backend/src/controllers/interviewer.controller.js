const { PDFParse } = require("pdf-parse")
const { generateInterviewReport } = require("../services/ai.service")
const InterviewReportModel = require("../models/interviewReport.model")

async function generateInterviewReportController(req, res){
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Resume file is required" })
        }

        const pdfParser = new PDFParse({ data: req.file.buffer })
        const resumeContent = await pdfParser.getText()
        const resumeText = resumeContent.text                  

        const { jobDescription, selfDescription } = req.body

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
            user: userId
        })

        res.status(201).json({ success: true, data: interviewReport })

    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

module.exports = { generateInterviewReportController }