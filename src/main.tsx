import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import  Login  from './pages/login/Login.tsx'
import  Dashboard  from './pages/Dashboard/Dashboard.tsx'
import Error from './pages/Error/Error.tsx'
import './index.css'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />, 
  },

  {
    path: "/Dashboard",
    element: <Dashboard />,
  },
  {
    path: "/*",
    element: <Error />,
  }


]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)

