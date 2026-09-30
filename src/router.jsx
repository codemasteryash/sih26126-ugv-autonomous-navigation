import { createBrowserRouter } from 'react-router-dom'
import MissionControlLayout from './shell/MissionControlLayout.jsx'
import MissionControlPage from './pages/MissionControlPage.jsx'
import ReplayPage from './pages/ReplayPage.jsx'
import SystemsPage from './pages/SystemsPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <MissionControlLayout />,
    children: [
      { index: true, element: <MissionControlPage /> },
      { path: 'replay', element: <ReplayPage /> },
      { path: 'systems', element: <SystemsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export default router
