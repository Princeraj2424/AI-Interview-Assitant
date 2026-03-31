import React from 'react'
import { Link } from 'react-router-dom'


const Register = () => {
    const handleSubmit = (e) => {
        e.preventDefault()
    }
  return (

    <main>
        <div className='form-container'>
            <h1>Register</h1>

            <p className='subtitle'>Create an account to get started.</p>

            <form onSubmit={handleSubmit}>

                 <div className='input-group'>
                    <label htmlFor="username">Username</label>
                    <input type="text" id='username' name='username' placeholder='Enter username'/>
                </div>

                <div className='input-group'>
                    <label htmlFor="email">Email</label>
                    <input type="email" id='email' name='email'placeholder='Enter email address'/> 
                </div>

                <div className='input-group'>
                    <label htmlFor="password">Password</label>
                    <input type="password" id='password' name='password' placeholder='Enter password'/>
                    
                </div>

                <button className='primary-button' type='submit'>Register</button>
        </form>
        <p className='redirect-text'>Already have an account? <Link to='/login' className='redirect-link'>Login here</Link></p>
        

        </div>
    </main>
  )
} 

export default Register
