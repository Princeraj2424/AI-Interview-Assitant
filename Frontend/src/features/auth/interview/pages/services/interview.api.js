import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
})

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error?.response?.status === 401 && window.location.pathname !== "/login") {
            window.location.href = "/login"
        }
        return Promise.reject(error)
    }
)
/**
 * @description Generate interview report by sending job description, resume and self description to the backend API. The backend will process the data, interact with the AI service to generate the interview report, and return it to the frontend.
 */
export const generateInterviewReport = async ({ jobDescription, resume, selfDescription }) => {
const formData = new FormData()
formData.append("jobDescription", jobDescription)
formData.append("selfDescription", selfDescription)
formData.append("resume", resume)

const response = await api.post("/api/interview", formData, {
    headers:{
        "Content-Type": "multipart/form-data"
    }
})

return response.data.data
}
/**
 * @description serve the interview report for a given interview ID by making a GET request to the backend API. The backend will retrieve the interview report from the database and return it to the frontend.
 */

export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)
    return response.data.data
}

/**
 * @description fetch all interview reports for the authenticated user by making a GET request to the backend API. The backend will retrieve all interview reports associated with the authenticated user from the database and return them to the frontend.
 */

export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/reports")
    return response.data.data
}

export const downloadSuggestedResumePdf = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}/resume`, {
        responseType: "blob"
    })

    return response.data
}

export const evaluateVoiceInterviewTurn = async ({ interviewId, answer, questionIndex, currentQuestion }) => {
    const response = await api.post(`/api/interview/report/${interviewId}/voice-turn`, {
        answer,
        questionIndex,
        currentQuestion
    })

    return response.data.data
}

/**
 * @description Complete voice interview and calculate overall performance
 */
export const completeVoiceInterview = async (interviewId) => {
    const response = await api.post(`/api/interview/report/${interviewId}/voice-complete`)
    return response.data.data
}

/**
 * @description Get voice interview feedback and performance results
 */
export const getVoiceInterviewFeedback = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}/voice-feedback`)
    return response.data.data
}
