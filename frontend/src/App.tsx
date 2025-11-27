import { Routes, Route, Link } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ExpensesPage from './pages/ExpensesPage'
import SubscriptionsPage from './pages/SubscriptionsPage'


function App() {
  return (
    <div>
      <header>
        <nav>
          <ul style={{ display: 'flex', gap: '1rem', listStyle: 'none' }}>
            <li>
              <Link to='/'>Accueil</Link>
            </li>
            <li>
              <Link to='/expenses'>Dépenses</Link>
            </li>
            <li>
              <Link to='/subscriptions'>Abonnements</Link>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/expenses' element={<ExpensesPage />} />
          <Route path='/subscriptions' element={<SubscriptionsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
