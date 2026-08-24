import { createBrowserRouter, Navigate } from "react-router-dom"
import AuthLayout from "@/features/auth/layouts/AuthLayout"
import LoginContainer from "@/features/auth/containers/LoginContainer"
import RegisterContainer from "@/features/auth/containers/RegisterContainer"
import ProtectedRoutes from "@/components/security/ProtectedRoutes"
export const router = createBrowserRouter([
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: "login",    element: <LoginContainer /> },
      { path: "register", element: <RegisterContainer /> },
    ],
  },
  { 
    path: "/", 
    element: <ProtectedRoutes><div>Home</div></ProtectedRoutes>
  },
  { path: "*", element: <Navigate to="/auth/login" replace /> },
])