import { useState } from 'react';
import wxtLogo from '/wxt.svg';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
      <div className='app'>
        <a href="https://wxt.dev" target="_blank">
          <img src={wxtLogo} className="logo" alt="WXT logo" />
        </a>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
  );
}

export default App;
