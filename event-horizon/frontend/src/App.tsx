import { useState } from 'react';
import { Greet } from "../wailsjs/go/main/App";
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';

function App() {
  const [resultText, setResultText] = useState("Please enter your name below 👇");

  const [name, setName] = useState('');
  const updateName = (e: any) => setName(e.target.value);
  const updateResultText = (result: string) => setResultText(result);

  function greet() {
    Greet(name).then(updateResultText);
  }

  return (
    <div className='w-screen h-screen'>
      <div className='w-full h-full p-96 flex flex-col justify-center items-center gap-2'>
        <div id="result" className="result">{resultText}</div>
        <Input onChange={updateName} autoComplete="off" name="input" type="text" />
        <Button className="btn" onClick={greet}>Greet</Button>
      </div>
    </div>
  )
}

export default App
