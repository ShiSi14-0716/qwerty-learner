import Loading from './components/Loading'
import './index.css'
import { ErrorBook } from './pages/ErrorBook'
import MobilePage from './pages/Mobile'
import TypingPage from './pages/Typing'
import { isOpenDarkModeAtom } from '@/store'
import { autoSyncOnLoad } from '@/utils/sync/gistSync'
import { Analytics } from '@vercel/analytics/react'
import 'animate.css'
import { useAtomValue } from 'jotai'
import mixpanel from 'mixpanel-browser'
import process from 'process'
import React, { Suspense, lazy, useEffect, useRef, useState } from 'react'
import 'react-app-polyfill/stable'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'

const AnalysisPage = lazy(() => import('./pages/Analysis'))
const GalleryPage = lazy(() => import('./pages/Gallery-N'))

if (process.env.NODE_ENV === 'production') {
  // for prod
  mixpanel.init('bdc492847e9340eeebd53cc35f321691')
} else {
  // for dev
  mixpanel.init('5474177127e4767124c123b2d7846e2a', { debug: true })
}

function App() {
  const darkMode = useAtomValue(isOpenDarkModeAtom)
  useEffect(() => {
    darkMode ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark')
  }, [darkMode])

  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600)
  const prevIsMobile = useRef(isMobile)

  useEffect(() => {
    const handleResize = () => {
      const nextIsMobile = window.innerWidth <= 600
      // 仅在移动端/桌面端状态真正切换时才执行操作，避免每次 resize 都刷新
      if (nextIsMobile !== prevIsMobile.current) {
        prevIsMobile.current = nextIsMobile
        setIsMobile(nextIsMobile)
        // 从移动端切回桌面端时，客户端导航回首页（不整页刷新，避免路径跳转 404）
        if (!nextIsMobile) {
          navigate('/')
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [navigate])

  // 启动时自动从云端同步最新数据
  useEffect(() => {
    const autoSync = localStorage.getItem('qwerty-learner-auto-sync') === 'true'
    if (!autoSync) return

    // 用 sessionStorage 防止刷新后重复同步
    if (sessionStorage.getItem('qwerty-learner-sync-done')) return

    const token = localStorage.getItem('qwerty-learner-cloud-token')?.trim()
    const gistId = localStorage.getItem('qwerty-learner-cloud-gist-id')?.trim()
    if (!token || !gistId) return

    sessionStorage.setItem('qwerty-learner-sync-done', '1')

    autoSyncOnLoad(token, gistId).then((result) => {
      if (result.updated) {
        // 云端数据更新，刷新页面加载新数据
        window.location.reload()
      }
    })
  }, [])

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {isMobile ? (
          <Route path="/*" element={<Navigate to="/mobile" />} />
        ) : (
          <>
            <Route index element={<TypingPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/error-book" element={<ErrorBook />} />
            <Route path="/*" element={<Navigate to="/" />} />
          </>
        )}
        <Route path="/mobile" element={<MobilePage />} />
      </Routes>
    </Suspense>
  )
}

function Root() {
  return (
    <React.StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <App />
        <Analytics />
      </BrowserRouter>
    </React.StrictMode>
  )
}

const container = document.getElementById('root')

container && createRoot(container).render(<Root />)
