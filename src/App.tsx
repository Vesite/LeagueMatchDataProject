import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import CSVLoader from './CSVLoader'; // Assuming CSVLoader.tsx is in the same directory


function App() {

  return (
    <>
      <div style={{ marginTop: '20px' }}>
        <CSVLoader />
      </div>
    </>
  )
}

export default App
