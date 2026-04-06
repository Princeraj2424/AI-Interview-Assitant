import { useState } from 'react'
import {useAuth} from "../hooks/useAuth"
import { Link, useNavigate } from "react-router-dom"
import "../services/auth.form.scss"


const Login = () => {
    const {Loading, handleLogin} = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const navigate = useNavigate()
    

    const handleSubmit = async (e) => {
        e.preventDefault()
        await handleLogin({email, password})
        navigate("/")
    }
    return (
        <main className='auth-page'>
            <section className='auth-card'>
                <div className='auth-brand'>
                    <span className='auth-pill'>AI Mock Interviews</span>
                    <h1>Welcome Back</h1>
                    <p>Sign in to generate personalized interview strategies and track your prep progress.</p>
                </div>

                <form onSubmit={handleSubmit} className='auth-form'>
                    <div className='input-group'>
                        <label htmlFor="email">Email</label>
                        <input type="email" id='email' name='email' placeholder='you@example.com' value={email} onChange={(e) => setEmail(e.target.value)} /> 
                    </div>

                    <div className='input-group'>
                        <label htmlFor="password">Password</label>
                        <input type="password" id='password' name='password' placeholder='Enter your password' value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>

                    <button className='primary-button' type='submit' disabled={Loading}>
                        {Loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p className='redirect-text'>
                    Don't have an account? <Link to='/register' className='redirect-link'>Create one</Link>
                </p>
            </section>
        </main>
    )
}

export default Login
