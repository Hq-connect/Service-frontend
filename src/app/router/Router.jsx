import { createBrowserRouter, Navigate } from "react-router-dom"
import AuthLayout from "@/features/auth/layouts/AuthLayout"
import LoginContainer from "@/features/auth/containers/LoginContainer"
import RegisterContainer from "@/features/auth/containers/RegisterContainer"
import ProtectedRoutes from "@/components/security/ProtectedRoutes"
import AppLayout from "@/global/layout/AppLayour"
import UnderConstruction from "@/components/ui/UnderConstruction"
import ChatPage from "@/features/chats/pages/ChatPage"
import MeetsPage from "@/features/meets/pages/MeetsPage"
import RecordedSessionsPage from "@/features/meets/pages/RecordedSessionsPage"
import MeetingRoomContainer from "@/features/meets/containers/MeetingRoomContainer"
import { ProjectsDashboard, BoardView } from "@/features/productivity"

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
      { path: "home",   element: <UnderConstruction /> },
      { path: "tasks",  element: <ProjectsDashboard /> },
      { path: "tasks/projects/:projectId", element: <BoardView /> },
      { path: "docs",   element: <UnderConstruction /> },
      { path: "files",  element: <UnderConstruction /> },
      { path: "meets",  element: <MeetsPage /> },
      { path: "meets/recordings", element: <RecordedSessionsPage /> },
      { path: "ask-ai", element: <UnderConstruction /> },

      // Chat routes - type-scoped
      { path: "chats",                    element: <ChatPage /> },
      { path: "chats/dm",                 element: <ChatPage chatType="dm" /> },
      { path: "chats/dm/:chatId",         element: <ChatPage chatType="dm" /> },
      { path: "chats/group",              element: <ChatPage chatType="group" /> },
      { path: "chats/group/:chatId",      element: <ChatPage chatType="group" /> },
      { path: "chats/channel",            element: <ChatPage chatType="channel" /> },
      { path: "chats/channel/:chatId",    element: <ChatPage chatType="channel" /> },
    ]
  },
  {
    path: "/meets/room/:joinCode",
    element: (
      <ProtectedRoutes>
        <MeetingRoomContainer />
      </ProtectedRoutes>
    ),
  },
  { path: "*", element: <Navigate to="/auth/login" replace /> },
])