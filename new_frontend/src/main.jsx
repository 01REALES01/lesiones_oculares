import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'

// Sin StrictMode: en dev, StrictMode doble-monta y destruye el contexto WebGL
// de React Three Fiber; el ojo 3D desaparecía a ~1s.
ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
)
