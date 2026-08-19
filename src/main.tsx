import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { EPAProvider } from '@/context/EPAContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <EPAProvider>
        <App />
      </EPAProvider>
    </BrowserRouter>
  </StrictMode>,
)
