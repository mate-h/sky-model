import React from 'react'
import ReactDOM from 'react-dom/client'
import Canvas from './canvas'
import Controls from './controls'
import 'normalize.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Canvas />
    <Controls />
  </React.StrictMode>
)
