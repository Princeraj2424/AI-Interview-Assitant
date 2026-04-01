import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import{useAuth} from "../hooks/useAuth"
import {useNavigate} from "react-router-dom"


const Register = () => {
const navigate = useNavigate()
const [username, setUsername] = useState("")
const [email, setEmail] = useState("")
const [password, setPassword] = useState("")
const {Loading, handleRegister} = useAuth()


    const handleSubmit =async (e) => {
        e.preventDefault()
       await handleRegister({username, email, password})
        navigate("/login")

        if(Loading){
            return (<main><h1>Loading.....</h1></main>)
        }
    }
    

  return (

    <main>
        <div className='form-container'>
            <h1>Register</h1>

            <p className='subtitle'>Create an account to get started.</p>

            <form onSubmit={handleSubmit}>

                 <div className='input-group'>
                    <label htmlFor="username">Username</label>
                    <input type="text" id='username' name='username' placeholder='Enter username' value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>

                <div className='input-group'>
                    <label htmlFor="email">Email</label>
                    <input type="email" id='email' name='email' placeholder='Enter email address' value={email} onChange={(e) => setEmail(e.target.value)} /> 
                </div>

                <div className='input-group'>
                    <label htmlFor="password">Password</label>
                    <input type="password" id='password' name='password' placeholder='Enter password' value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>

                <button className='primary-button' type='submit' disabled={Loading}>
                    {Loading ? 'Registering...' : 'Register'}
                </button>
            </form>
            <p className='redirect-text'>Already have an account? <Link to='/login' className='redirect-link'>Login here</Link></p>
            

        </div>
    </main>
  )
} 

export default Register
