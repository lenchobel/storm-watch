import React from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { LanguageProvider } from './i18n'
import { App } from './ui/App'
import './ui/styles.css'
import './ui/screens.css'
import './ui/debrief.css'

registerSW({ immediate: true })

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </React.StrictMode>
  )
}
