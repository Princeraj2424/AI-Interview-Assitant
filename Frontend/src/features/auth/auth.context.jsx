import {createContext, useState} from "react"
/* eslint-disable react-refresh/only-export-components */

export const AuthContext = createContext({
    user: null,
    setUser: () => {},
    Loading: false,
    setLoading: () => {}
})
export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null)
    const [Loading, setLoading] = useState(false)
    return(
        <AuthContext.Provider value ={{user,setUser,Loading, setLoading}}>
            {children}
        </AuthContext.Provider>
    )
}

