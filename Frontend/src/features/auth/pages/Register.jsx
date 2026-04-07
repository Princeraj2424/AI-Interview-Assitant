import { useState } from 'react'
import { Link } from 'react-router-dom'
import{useAuth} from "../hooks/useAuth"
import {useNavigate} from "react-router-dom"
import "../services/auth.form.scss"


const Register = () => {
const navigate = useNavigate()
const [username, setUsername] = useState("")
const [email, setEmail] = useState("")
const [password, setPassword] = useState("")
const [error, setError] = useState("")
const {Loading, handleRegister} = useAuth()


    const handleSubmit =async (e) => {
        e.preventDefault()
        setError("")
        try {
            await handleRegister({username, email, password})
            // Redirect to home after successful registration
            navigate("/home")
        } catch (err) {
            setError(err.message || "Registration failed. Please try again.")
        }
    }
    

    return (
        <main className='auth-page'>
            <section className='auth-card'>
                <div className='auth-brand'>
                    <span className='auth-pill'>AI Mock Interviews</span>
                    <h1>Create Account</h1>
                    <p>Join now to build tailored interview plans and improve with AI-guided practice.</p>
                </div>

                <form onSubmit={handleSubmit} className='auth-form'>
                    {error && <div style={{color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem'}}>{error}</div>}
                    
                    <div className='input-group'>
                        <label htmlFor="username">Username</label>
                        <input type="text" id='username' name='username' placeholder='Choose a username' value={username} onChange={(e) => setUsername(e.target.value)} required/>
                    </div>

                    <div className='input-group'>
                        <label htmlFor="email">Email</label>
                        <input type="email" id='email' name='email' placeholder='you@example.com' value={email} onChange={(e) => setEmail(e.target.value)} required/> 
                    </div>

                    <div className='input-group'>
                        <label htmlFor="password">Password</label>
                        <input type="password" id='password' name='password' placeholder='Create a strong password' value={password} onChange={(e) => setPassword(e.target.value)} required/>
                    </div>

                    <button className='primary-button' type='submit' disabled={Loading}>
                        {Loading ? 'Registering...' : 'Create Account'}
                    </button>
                </form>

                <p className='redirect-text'>Already have an account? <Link to='/login' className='redirect-link'>Login here</Link></p>
            </section>
        </main>
    )
} 

export default Register
