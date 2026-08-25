import { createBrowserRouter, Navigate } from "react-router-dom"
import AuthLayout from "@/features/auth/layouts/AuthLayout"
import LoginContainer from "@/features/auth/containers/LoginContainer"
import RegisterContainer from "@/features/auth/containers/RegisterContainer"
import ProtectedRoutes from "@/components/security/ProtectedRoutes"
import AppLayout from "@/global/layout/AppLayour"
import UnderConstruction from "@/components/ui/UnderConstruction"

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
    element: (
      <ProtectedRoutes>
        <AppLayout />
      </ProtectedRoutes>
    ),
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: "home", element: <UnderConstruction /> },
      { path: "tasks", element: <UnderConstruction /> },
      { path: "docs", element: <UnderConstruction /> },
      { path: "files", element: <UnderConstruction /> },
      { path: "meets", element: <UnderConstruction /> },
      { path: "ask-ai", element: <UnderConstruction /> },
      { path: "chats", element: <UnderConstruction /> },
    ]
  },
  { path: "*", element: <Navigate to="/auth/login" replace /> },
])