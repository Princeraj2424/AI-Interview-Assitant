import { useState } from 'react'
import {useAuth} from "../hooks/useAuth"
import { Link, useLocation, useNavigate } from "react-router-dom"
import "../services/auth.form.scss"


const Login = () => {
    const {Loading, handleLogin} = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const navigate = useNavigate()
    const location = useLocation()
    

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        try {
            await handleLogin({email, password})
            const redirectTo = location.state?.from || "/home"
            navigate(redirectTo, { replace: true })
        } catch (err) {
            setError(err.message || "Login failed. Please try again.")
        }
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
                    {error && <div style={{color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem'}}>{error}</div>}
                    
                    <div className='input-group'>
                        <label htmlFor="email">Email</label>
                        <input type="email" id='email' name='email' placeholder='you@example.com' value={email} onChange={(e) => setEmail(e.target.value)} required/> 
                    </div>

                    <div className='input-group'>
                        <label htmlFor="password">Password</label>
                        <input type="password" id='password' name='password' placeholder='Enter your password' value={password} onChange={(e) => setPassword(e.target.value)} required/>
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
