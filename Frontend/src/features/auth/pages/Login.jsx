import React, { useState } from 'react'
import {useAuth} from "../hooks/useAuth"
import {useNavigate} from "react-router-dom"


const Login = () => {
    const {Loading, handleLogin} = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const Navigate = useNavigate()
    

    const handleSubmit = (e) => {
        e.preventDefault()
        handleLogin({email, password})
        Navigate("/")

        if(Loading){
            return (<main><h1>Loading.....</h1></main>)
        }
    }
  return (
    <main>
        <div className='form-container'>
            <h1>Interview AI</h1>
            <p className='subtitle'>Login to continue your mock interview practice.</p>

            <form onSubmit={handleSubmit}>
                <div className='input-group'>
                    <label htmlFor="email">Email</label>
                    <input type="email" id='email' name='email' placeholder='Enter email address' value={email} onChange={(e) => setEmail(e.target.value)} /> 
                </div>

                <div className='input-group'>
                    <label htmlFor="password">Password</label>
                    <input type="password" id='password' name='password' placeholder='Enter password' value={password} onChange={(e) => setPassword(e.target.value)} />
                    
                </div>

                <button className='primary-button' type='submit' disabled={Loading}>
                    {Loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        <p className='redirect-text'>Don't have an account? <a href='/register' className='redirect-link'>Register</a></p>

        </div>
    </main>
  )
}

export default Login
