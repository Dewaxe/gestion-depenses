import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <h1>Gestion de dépenses et abonnements</h1>
        <p>Bienvenue dans ton application de suivi financier 🚀</p>
      </div>
    </>
  )
}

export default App
