import { downloadSuggestedResumePdf, evaluateVoiceInterviewTurn, getAllInterviewReports, generateInterviewReport, getInterviewReportById, completeVoiceInterview, getVoiceInterviewFeedback } from "../interview/pages/services/interview.api";
import { useCallback, useContext } from "react";
import { InterviewContext } from "../interview/interview.context";  


export const useInterview = () => {

    const context = useContext(InterviewContext)

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = useCallback(async ({ jobDescription, resume, selfDescription }) => {

        try {
            setLoading(true)
            const response = await generateInterviewReport({ jobDescription, resume, selfDescription })
            setReport(response)
            return response
        } catch (error) {
            console.error("Error generating interview report:", error)
            throw error
        }
        finally {
            setLoading(false)
        }
    }, [setLoading, setReport])

    const reportById = useCallback(async (interviewId) => {
        setLoading(true)
        try {
            const response = await getInterviewReportById(interviewId)

            setReport(response)
            return response
        } catch (error) {
            console.error("Error fetching interview report by ID:", error)
        }
        finally {
            setLoading(false)
        }
    }, [setLoading, setReport])

    const getAllReports = useCallback(async () => {
        setLoading(true)
        try {
            const response = await getAllInterviewReports()
            setReports(response)
            return response
        } catch (error) {
            console.error("Error fetching all interview reports:", error)
        }
        finally {
            setLoading(false)
        }
    }, [setLoading, setReports])

    const downloadSuggestedResume = useCallback(async (interviewId) => {
        setLoading(true)
        try {
            const pdfBlob = await downloadSuggestedResumePdf(interviewId)
            const url = window.URL.createObjectURL(pdfBlob)
            const link = document.createElement("a")
            link.href = url
            link.download = `ai_resume_${interviewId}.pdf`
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error("Error downloading suggested resume:", error)
        } finally {
            setLoading(false)
        }
    }, [setLoading])

    const evaluateVoiceTurn = useCallback(async ({ interviewId, answer, questionIndex, currentQuestion }) => {
        setLoading(true)
        try {
            return await evaluateVoiceInterviewTurn({ interviewId, answer, questionIndex, currentQuestion })
        } catch (error) {
            console.error("Error evaluating voice interview turn:", error)
            return null
        } finally {
            setLoading(false)
        }
    }, [setLoading])

    const completeVoiceInterviewSession = useCallback(async (interviewId) => {
        setLoading(true)
        try {
            return await completeVoiceInterview(interviewId)
        } catch (error) {
            console.error("Error completing voice interview:", error)
            return null
        } finally {
            setLoading(false)
        }
    }, [setLoading])

    const getVoiceFeedback = useCallback(async (interviewId) => {
        setLoading(true)
        try {
            return await getVoiceInterviewFeedback(interviewId)
        } catch (error) {
            console.error("Error fetching voice interview feedback:", error)
            return null
        } finally {
            setLoading(false)
        }
    }, [setLoading])

    return {
        loading,
        report,
        reports,
        generateReport,
        reportById,
        getAllReports,
        downloadSuggestedResume,
        evaluateVoiceTurn,
        completeVoiceInterviewSession,
        getVoiceFeedback,
    }
}




    
