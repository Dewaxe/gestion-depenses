import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './auth/AuthContext.tsx'
import { AppRouter } from './AppRouter.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<AuthProvider>
			<AppRouter/>
		</AuthProvider>
	</React.StrictMode>
)