import { useState, useEffect } from 'react'
import HawkinsTerminal from './components/HawkinsTerminal'
import CRTMonitorFrame from './components/CRTMonitorFrame'
import CRTMonitorFrameMobile from './components/CRTMonitorFrameMobile'

function App() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth > 900
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setIsDesktop(window.innerWidth > 900)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (isDesktop) {
    return (
      <CRTMonitorFrame>
        <HawkinsTerminal />
      </CRTMonitorFrame>
    )
  }

  // On mobile, use the mobile CRT frame with portrait image
  return (
    <CRTMonitorFrameMobile>
      <HawkinsTerminal />
    </CRTMonitorFrameMobile>
  )
}

export default App
