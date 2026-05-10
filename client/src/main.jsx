import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter} from 'react-router-dom'
import {AuthProvider} from "./context/authContext.jsx"




if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/sw.js")
            .then((reg) => console.log("✅ Service Worker registered:", reg.scope))
            .catch((err) => console.error("❌ Service Worker failed:", err));
    });
}


createRoot(document.getElementById('root')).render(
  <BrowserRouter>
   <AuthProvider>
     <App />
   </AuthProvider>
  </BrowserRouter>
  
)
