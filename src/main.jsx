/**
 * main.jsx
 * ========
 * Application entry point.
 * Mounts the React app into the #root div in index.html.
 */

import ReactDOM from 'react-dom/client'
import App from './App'

// Import global styles (includes Tailwind CSS v4)
import './index.css'

// Mount the React app (StrictMode removed — prevents double webcam init race)
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
