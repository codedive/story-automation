import { GoogleOAuthProvider } from '@react-oauth/google'
import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import { AiToggleProvider } from './context/AiToggleContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import AllStoriesPage from './pages/AllStoriesPage'
import Dashboard from './pages/Dashboard'
import LoginPage from './pages/LoginPage'
import SettingsPage from './pages/SettingsPage'
import StoriesPage from './pages/StoriesPage'
import StoryDetailPage from './pages/StoryDetailPage'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function AuthenticatedApp() {
  const { token } = useAuth()

  if (!token) {
    return <LoginPage />
  }

  return (
    <AiToggleProvider>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/categories/:categoryId/stories" element={<StoriesPage />} />
          <Route path="/stories" element={<AllStoriesPage />} />
          <Route path="/stories/:storyId" element={<StoryDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppLayout>
    </AiToggleProvider>
  )
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}


export default App
