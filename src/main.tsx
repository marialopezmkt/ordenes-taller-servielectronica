import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// HashRouter: así el sitio funciona en GitHub Pages (alojamiento estático)
// sin necesitar configuración de servidor para las rutas internas.
// No cambiar a BrowserRouter si este proyecto se va a entregar por GitHub Pages.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
