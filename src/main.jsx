import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/bebas-neue'
import '@fontsource/barlow-condensed/400.css'
import '@fontsource/barlow-condensed/500.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/share-tech-mono'
import '@fontsource/special-elite'
import './styles.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
