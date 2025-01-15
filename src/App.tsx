import { useState } from 'react'
import clipboardy from 'clipboardy'

export default function App() {
  const [coordsInput, setCoordsInput] = useState('');
  const [ready, setReady] = useState(false);
  const [coords, setCoords] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);


  const regex = /-?\d+\.\d+,-?\d+\.\d+/g;

  function coordsInputChanged(val: string) {
    setCoordsInput(val)
    const matches = val.match(regex);
    setReady(matches ? (!ready ? true: true) : false)
    setCurrent(0)
    if(!matches) {
      setCoords([])
      return
    }
    setCoords(matches as string[])
    clipboardy.write(matches[0]);
  }

  function next() {
    const temp = current;
    if(temp >= coords.length - 1) setCurrent(0)
    else setCurrent(prev => prev + 1)
    clipboardy.write(coords[temp + 1]);
  }

  return <div className='main-wrapper'>
    <input type="text" value={coordsInput} onChange={e => coordsInputChanged(e.target.value)}/>
    <span className={`ready${ready ? ' active' : ''}`}>{ready ? 'Coords are ready, next: ' : 'No coords found, wrong input'}{coords.length ? <span className='coord'>#{current + 1} {coords[current]}</span>: null}</span>
    <button className='next-btn' onClick={next}>Next</button>
  </div>
}