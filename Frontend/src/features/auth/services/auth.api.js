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

function getErrorMessage(error) {
    if (error.response?.data?.message) {
        return error.response.data.message
    }
    if (error.message) {
        return error.message
    }
    return "An error occurred"
}

export async function register(username, email, password){
    try{
        const response = await api.post("/api/auth/register",{
            username,
            email,
            password
        })
    
        return response.data
    }catch(error){
        console.log("error while registering user", error)
        const message = getErrorMessage(error)
        throw new Error(message)
    }
}

export async function login(email, password){
    try{
        const response = await api.post("/api/auth/login",{
            email,
            password
        })
        return response.data
    }catch(error){
        console.log("error while logging in user", error)
        const message = getErrorMessage(error)
        throw new Error(message)
    }
}

export async function logout(){
    try{
        const response = await api.get("/api/auth/logout")
        return response.data
    }catch(error){
        console.log("error while logging out user", error)
        const message = getErrorMessage(error)
        throw new Error(message)
    }
}

export async function getMe(){
    try{
        const response = await api.get("/api/auth/get-me")

        return response.data
    }catch(error){
        console.log("error while fetching user details", error)
        // Don't throw error for getMe - just return null
        return { user: null }
    }

}