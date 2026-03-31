import React from 'react'

const Login = () => {
    const handleSubmit = (e) => {
        e.preventDefault()
    }
  return (
    <main>
        <div className='form-container'>
            <h1>Interview AI</h1>
            <p className='subtitle'>Login to continue your mock interview practice.</p>

            <form onSubmit={handleSubmit}>
                <div className='input-group'>
                    <label htmlFor="email">Email</label>
                    <input type="email" id='email' name='email'placeholder='Enter email address'/> 
                </div>

                <div className='input-group'>
                    <label htmlFor="password">Password</label>
                    <input type="password" id='password' name='password' placeholder='Enter password'/>
                    
                </div>

                <button className='primary-button' type='submit'>Login</button>
        </form>
        <p className='redirect-text'>Don't have an account? <a href='/register' className='redirect-link'>Register</a></p>

        </div>
    </main>
  )
}

export default Login
