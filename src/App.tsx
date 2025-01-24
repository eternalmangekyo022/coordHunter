/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { modalOpenAtom } from './store/atoms'
import laPreset from './presets/la.json'
import taipeiPreset from './presets/taipei.json'
import Modal from './components/Modal'
import clipboardy from 'clipboardy'
import axios from 'axios'
import loadTsp from './hooks/useTsp'

type ISelection = 'operations' | 'la' | 'taipei' | '' | 'cb' | 'last';

export default function App() {
  const [coordsInput, setCoordsInput] = useState('');
  const [ready, setReady] = useState(false);
  const [coords, setCoords] = useState<Coord[]>([]);
  const [current, setCurrent] = useState(0);
  const [selectedMode, setSelectedMode] = useState<ISelection>('');
  const [, setModalOpen] = useAtom(modalOpenAtom);
  const [apis, setApis] = useState<ApiCityMap | undefined>(undefined);
  const regex = /-?\d+\.\d+,-?\d+\.\d+/g;

  const setCurrentMod = (curr: number) => {
    setCurrent(curr)
    localStorage.setItem('savedProgress', curr.toString())
  }

  async function loadCoords(val: string) {
    setCoordsInput(val)
    localStorage.setItem('savedCoords', val)
    const matches = val.match(regex);
    setReady(matches ? (!ready ? true: true) : false)
    setCurrentMod(0)
    if(!matches) {
      setCoords([])
      return
    }
    const tsp = await loadTsp(matches as string[], { inDepth: true });
    clipboardy.write(tsp[0].coord)
    setCoords(tsp)
  }

  const selectionChanged = async (e: ISelection) => {
    setSelectedMode(e)
    if(e === '') {
      setCoordsInput('')
      setCurrent(0)
      setReady(false)
      setCoords([])
    } 
    else if(e === 'cb') pasteFromCb()
    else if(e === 'last') loadLastSession()
    else if(e === 'operations') {
      setModalOpen(true)
      // loadQuest()
    }
    else loadCoords(e === 'la' ? laPreset.join(';') : taipeiPreset.join(';'))
  }
  
  async function next() {
    if (coords.length === 0) {
      console.warn("No coordinates available to navigate.");
      return;
    }
  
    try {
        const nextIndex = (current + 1) % coords.length;
        const toCopy = coords[nextIndex].coord;
  
        await clipboardy.write(toCopy);
        setCurrentMod(nextIndex);

    } catch (err) {
      console.error("Clipboard write failed:", err);
    }
  }

  async function pasteFromCb() {
    const copied = await clipboardy.read()
    setCoordsInput(copied)
    loadCoords(copied)
    setSelectedMode('')
    return copied
  }

  function loadLastSession() {
    const savedProgress = localStorage.getItem('savedProgress')
    const savedCoords = localStorage.getItem('savedCoords')

    if(savedCoords) loadCoords(savedCoords)
    if(savedProgress) setCurrent(parseInt(savedProgress))
  }

  function buttonContextMenu(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault();
    if(coords.length) clipboardy.write(coords[0].coord);
  }
  
  async function loadOperation(operation: Operations, city: ApiCity, payload: string): Promise<void> {
    const url = `https://nyc-backend.vercel.app/${operation}/${city}/${payload}`;
    const res = await axios.get<{ lat: number, lng: number }[]>(url);
    setCoordsInput(res.data.map(({ lat, lng }) => `${lat},${lng}`).join(';'))
  }

  useEffect(() => {
    async function loadCities() {
      const urls = await axios.get<ApiCityMap>(
        "https://nyc-backend.vercel.app/urls/"
      );
      setApis(urls.data);
    }
    loadCities()
  }, [])

  useEffect(() => {
    loadCoords(coordsInput)
  }, [coordsInput])

  return <div className='main-wrapper'>
    <Modal loadOperation={loadOperation} apis={apis}/>
    <input type="text" value={coordsInput} onChange={e => setCoordsInput(e.target.value)}/>
    <select id='presets' onChange={e => selectionChanged(e.target.value as ISelection)} name="presets" >
      <option value="">{selectedMode !== '' ? 'Clear': 'Select A Preset'}</option>
      <option value="operations">Quest | Rocket</option>
      <option value="la">Los Angeles Unova</option>
      <option value="taipei">Taipei Unova</option>
      <option value="last">Load From Last Session</option>
      <option value="cb">Content From Clipboard</option>
    </select>
    <span className={`ready${ready ? ' active' : ''}`}>
      {!ready && 'Check Input'}{coords.length ? <span className='coord'>#{current + 1} 
        <button className='copy-btn' onClick={() => clipboardy.write(coords[current].coord)}>Copy</button>
      {current === coords.length - 1 ? '': '->' + (coords[current].distanceNext || 0).toFixed(2) + 'km'}</span>: null}
    </span>
    <button onContextMenu={e => buttonContextMenu(e)} className='next-btn' onClick={selectedMode === 'cb' ? pasteFromCb: next}>{selectedMode === 'cb' ? 'Paste From Clipboard' : 'Next'}</button>
  </div>
}