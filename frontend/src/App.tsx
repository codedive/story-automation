import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import { AiToggleProvider } from './context/AiToggleContext'
import AllStoriesPage from './pages/AllStoriesPage'
import Dashboard from './pages/Dashboard'
import SettingsPage from './pages/SettingsPage'
import StoriesPage from './pages/StoriesPage'
import StoryDetailPage from './pages/StoryDetailPage'

function App() {
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

export default App
