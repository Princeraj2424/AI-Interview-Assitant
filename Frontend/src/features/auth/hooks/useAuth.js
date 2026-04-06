import {useContext, useEffect} from "react"
import { AuthContext } from "../auth.context"
import {login, register,logout, getMe} from "../services/auth.api"

export const useAuth = () => {
    const context = useContext(AuthContext)
    const {user, setUser, Loading, setLoading} = context

    useEffect(()=>{
        const getAndSetUser = async () =>{
            try {
                const data = await getMe()
                setUser(data.user)
            } catch {
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        getAndSetUser()
    }, [setLoading, setUser])

    const handleLogin = async ({email, password}) => {
        setLoading(true)

        try{
            const data = await login(email, password)
            setUser(data.user)
            return data
        }catch(error){
            console.error("Error while logging in:", error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({username, email, password})=>{
        setLoading(true)
        try{

            const data = await register(username, email, password)
            setUser(data.user)
            return data
        }catch(error){
            console.error("Error while registering user", error)
            throw error
        } finally {
            setLoading(false)
        }
        
    }
    const handleLogout = async () => {
        setLoading(true)

        try{
            await logout()
            setUser(null)
        }catch(error){
            console.error("Error while logging out user", error)
        } finally {
            setLoading(false)
        }
    }

    return {user, Loading, handleLogin, handleRegister, handleLogout}

}
