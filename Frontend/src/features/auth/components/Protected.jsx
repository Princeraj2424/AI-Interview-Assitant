import {useAuth} from "../hooks/useAuth"
import {useNavigate} from "react-router-dom"

const Protected = ({children})=>{
    const {Loading, user} = useAuth()
    const navigate = useNavigate()

    if(Loading){
        return(<main><h1>Loading...</h1></main>)
    }
    if(!user){
        navigate("/login")

    }
    return children
}
export default Protected