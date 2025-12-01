import { useLocation } from 'react-router-dom'
import Header from '../Header/Header.jsx'
import Footer from '../Footer/Footer.jsx'
import Routers from '../../routes/Routers.jsx'

const Layout = ({ user, onLogin, onLogout }) => {
  const location = useLocation()
  const onLoginRoute = location.pathname === '/login'

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200">
      {!onLoginRoute && <Header user={user} onLogout={onLogout} />}
      <main
        className={`flex-1 ${onLoginRoute ? '' : 'px-4 py-10 sm:px-8'}`}
      >
        <Routers user={user} onLogin={onLogin} />
      </main>
      {!onLoginRoute && <Footer />}
    </div>
  )
}

export default Layout