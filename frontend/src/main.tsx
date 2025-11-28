import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.tsx'
import ExpensesPage from './pages/ExpensesPage.tsx'
import SubscriptionsPage from './pages/SubscriptionsPage.tsx'
import './index.css'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)