import { Navigate, createBrowserRouter } from "react-router-dom"
import Login from "./features/auth/pages/Login"
import Register from "./features/auth/pages/Register"
import Protected from "./features/auth/components/Protected"
import Dashboard from "./features/auth/pages/Dashboard"
import Home from "./features/auth/pages/Home"
import Interview from "./features/auth/pages/interview"
import VoiceInterviewAI from "./features/auth/pages/VoiceInterviewAI"
import VoiceResults from "./features/auth/pages/VoiceResults"

export const router =  createBrowserRouter([
    {
        path:"/",
        element:<Navigate to="/login" replace />
    },
    {
        path:"/login",
        element:<Login/>
    },
    {
        path:"/register",
        element:<Register/>
    },
    {
        path:"/home",
        element:<Protected><Dashboard/></Protected>
    },
    {
        path:"/plan",
        element:<Protected><Home/></Protected>
    },
    {
        path:"/interview/:interviewId",
        element:<Protected><Interview/></Protected>
    },
    {
        path:"/interview/:interviewId/voice",
        element:<Protected><VoiceInterviewAI/></Protected>
    },
    {
        path:"/interview/:interviewId/voice-results",
        element:<Protected><VoiceResults/></Protected>
    }
    
])
