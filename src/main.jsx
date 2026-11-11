import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Informes from './Informes.jsx'

// ?vista=pendientes o ?vista=catalogo obren els informes de només lectura per al client
const vista = new URLSearchParams(window.location.search).get('vista')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {vista ? <Informes vista={vista} /> : <App />}
  </React.StrictMode>,
)
