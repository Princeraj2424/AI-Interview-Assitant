import { RouterProvider } from "react-router-dom"
import {router} from "./app.routes.jsx"
import {AuthProvider} from "./features/auth/auth.context.jsx"
import Home from "./features/auth/pages/Home.jsx"


function App() {
  
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App

