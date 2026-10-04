import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import CopilotChatDrawer from '../copilot/CopilotChatDrawer'
import ExplainThisModal from '../copilot/ExplainThisModal'
import { GlowOrb } from '../common/DecorativeElements'

function Layout() {
  return (
    <div className="flex h-screen atmospheric-bg overflow-hidden font-sans relative">
      {/* Ambient background glows */}
      <GlowOrb color="mint" className="top-0 left-1/4 w-[500px] h-[500px] opacity-40" />
      <GlowOrb color="teal" className="bottom-0 right-1/4 w-[600px] h-[600px] opacity-30" />
      <GlowOrb color="indigo" className="top-1/3 right-10 w-[400px] h-[400px] opacity-20" />

      {/* Desktop Floating Sidebar (Hidden on mobile <768px) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 w-full">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-10 scroll-smooth">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible only on <768px) */}
      <MobileNav />

      {/* Global AI Financial Copilot UI */}
      <CopilotChatDrawer />
      <ExplainThisModal />
    </div>
  )
}

export default Layout