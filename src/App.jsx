import { BrowserRouter } from 'react-router-dom'
import { useState } from 'react'
import Layout from './components/Layout/Layout.jsx'

function App() {
  const [user, setUser] = useState(null)

  const handleLogin = (credentials) => {
    setUser(credentials)
  }

  const handleLogout = () => {
    setUser(null)
  }

  return (
    <BrowserRouter>
      <Layout user={user} onLogin={handleLogin} onLogout={handleLogout} />
    </BrowserRouter>
  )
}

export default App
