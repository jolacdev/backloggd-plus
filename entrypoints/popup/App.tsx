import { useState } from 'react';

import './App.css';
import wxtLogo from '/wxt.svg';

const App = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <a href="https://wxt.dev" rel="noreferrer" target="_blank">
        <img alt="WXT logo" className="logo" src={wxtLogo} />
      </a>
      <button onClick={() => setCount((c) => c + 1)}>count is {count}</button>
    </div>
  );
};

export default App;
