import {useAuth} from "../hooks/useAuth"
import {Navigate, useLocation} from "react-router-dom"

const Protected = ({children})=>{
    const {Loading, user} = useAuth()
    const location = useLocation()
    

    if(Loading){
        return(<main><h1>Loading...</h1></main>)
    }
    if(!user){
        return <Navigate to="/login" state={{ from: location.pathname }} replace /> 

    }
    return children
}
export default Protected