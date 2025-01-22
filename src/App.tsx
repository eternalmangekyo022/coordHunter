/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import { modalOpenAtom } from './store/atoms'
import laPreset from './presets/la.json'
import taipeiPreset from './presets/taipei.json'
import Modal from './components/Modal'
import clipboardy from 'clipboardy'
import axios from 'axios'

type Coord = {
  coord: string;
  distanceNext: number; // Null for the last coordinate, as there's no "next"
};

type ISelection = 'quest' | 'la' | 'taipei' | '' | 'cb' | 'last' | 'nycrocket';

export default function App() {
  const [coordsInput, setCoordsInput] = useState('');
  const [ready, setReady] = useState(false);
  const [coords, setCoords] = useState<Coord[]>([]);
  const [current, setCurrent] = useState(0);
  const [selectedMode, setSelectedMode] = useState<ISelection>('');
  const [, setModalOpen] = useAtom(modalOpenAtom);
  const [apis, setApis] = useState<ApiCityMap | undefined>(undefined);
  const regex = /-?\d+\.\d+,-?\d+\.\d+/g;
  const availableQuests = useRef<{ [key:string]: number }>({});

  const setCurrentMod = (curr: number) => {
    setCurrent(curr)
    localStorage.setItem('savedProgress', curr.toString())
  }

  function loadCoords(val: string) {
    setCoordsInput(val)
    localStorage.setItem('savedCoords', val)
    const matches = val.match(regex);
    setReady(matches ? (!ready ? true: true) : false)
    setCurrentMod(0)
    if(!matches) {
      setCoords([])
      return
    }
    sortByTsp(matches as string[]);
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
    else if(e === 'quest') {
      setModalOpen(true)
      // loadQuest()
    }
    else loadCoords(e === 'la' ? laPreset.join(';') : taipeiPreset.join(';'))
  }

  /**async function loadQuest() {
    const raw = await axios.get<{ quests: { lat: number, lng: number }[] }>('https://nyc-backend.vercel.app/quests/tyrunt', { headers: { 'Content-Type': 'application/json' } });

    const filtered = raw.data.quests.map(({ lat, lng }) => `${lat},${lng}`).join(';')
    loadCoords(filtered)
  }*/

  function d(coord1: string, coord2: string): number {
    const R = 6371; // Earth's radius in kilometers
    const toRadians = (degrees: number): number => degrees * (Math.PI / 180);
  
    const [lat1, lon1] = coord1.split(',').map(Number);
    const [lat2, lon2] = coord2.split(',').map(Number);

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }
  
  async function sortByTsp(coords: string[]) {
    if (coords.length < 2) {
      setCoords(coords.map(coord => ({ coord, distanceNext: coords.length === 1 ? 0 : d(coords[0], coords[1]) }))); // Single or empty input
      return;
    }

    type CoordList = {
      coords: Coord[],
      distance: number
    }

    const variations: CoordList[] = [];
    for(let i = 0; i < coords.length; i++) {
      console.log((i + 1) / coords.length * 100)
      let remaining = [...coords];
      const final: Coord[] = [];
    
      // Start with the first coordinate
      let current = coords[i];
      remaining = remaining.filter(coord => coord !== current);
      while (remaining.length > 0) {
        let closestIndex = 0;
        let shortestDistance = Infinity;
    
        // Find the closest coordinate
        for (let i = 0; i < remaining.length; i++) {
          const distance = d(current, remaining[i]);
          if (distance < shortestDistance) {
            shortestDistance = distance;
            closestIndex = i;
          }
        }
    
        // Add the current coordinate and its distance to the next one
        final.push({ coord: current, distanceNext: shortestDistance });
    
        // Update the current coordinate and remove it from the remaining list
        current = remaining.splice(closestIndex, 1)[0];}
        final.push({ coord: current, distanceNext: 0 });
        variations.push({ coords: final, distance: final.reduce((total, coord) => total + coord.distanceNext, 0) });
    }
    const shortest = variations.sort((a, b) => a.distance - b.distance)[0].coords
  
    // Add the last coordinate with no "next" distance
    clipboardy.write(shortest[0].coord);
    setCoords(shortest);
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
    async function loadAvailableQuests() {
      const res = await axios.get<{ [key:string]: number }>(`https://nyc-backend.vercel.app/quests/`)
      availableQuests.current = res.data
    }
    async function loadCities() {
      const urls = await axios.get<ApiCityMap>(
        "https://nyc-backend.vercel.app/urls/"
      );
      setApis(urls.data);
    }
    loadCities()
    loadAvailableQuests()
  }, [])

  useEffect(() => {
    loadCoords(coordsInput)
  }, [coordsInput])

  return <div className='main-wrapper'>
    <Modal loadOperation={loadOperation} apis={apis}/>
    <input type="text" value={coordsInput} onChange={e => setCoordsInput(e.target.value)}/>
    <select id='presets' onChange={e => selectionChanged(e.target.value as ISelection)} name="presets" >
      <option value="">{selectedMode !== '' ? 'Clear': 'Select A Preset'}</option>
      <option value="quest">Quest</option>
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