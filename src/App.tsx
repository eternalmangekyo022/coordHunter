import { useState, useEffect } from 'react'
import clipboardy from 'clipboardy'
import laPreset from './presets/la.json'
import taipeiPreset from './presets/taipei.json'

type Coord = {
  coord: string;
  distanceNext: number; // Null for the last coordinate, as there's no "next"
};

type ISelection = 'la' | 'taipei' | '' | 'cb';

export default function App() {
  const [coordsInput, setCoordsInput] = useState('');
  const [ready, setReady] = useState(false);
  const [coords, setCoords] = useState<Coord[]>([]);
  const [current, setCurrent] = useState(0);
  const [selectedMode, setSelectedMode] = useState<ISelection>('');
  const regex = /-?\d+\.\d+,-?\d+\.\d+/g;

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
    if(e === '') return
    loadCoords(e === 'la' ? laPreset.join(';') : taipeiPreset.join(';'))
  }

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
    console.log(shortest);
  
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
    return copied
  }

  useEffect(() => {
    const savedProgress = localStorage.getItem('savedProgress')
    const savedCoords = localStorage.getItem('savedCoords')

    if(savedCoords) loadCoords(savedCoords)
    if(savedProgress) setCurrent(parseInt(savedProgress))

  } ,[])

  return <div className='main-wrapper'>
    <input type="text" value={coordsInput} onChange={e => loadCoords(e.target.value)}/>
    <select onChange={e => selectionChanged(e.target.value as ISelection)} name="presets" >
      <option value="">Select a preset</option>
      <option value="la">Los Angeles</option>
      <option value="taipei">Taipei</option>
      <option value="cb">Content From Clipboard</option>
    </select>
    <span className={`ready${ready ? ' active' : ''}`}>{ready ? 'Coords are ready, now: ' : 'No coords found, wrong input'}{coords.length ? <span className='coord'>#{current + 1} {coords[current].coord}{current === coords.length - 1 ? '': ' Next ' + (coords[current].distanceNext || 0).toFixed(2) + 'km'}</span>: null}</span>
    <button className='next-btn' onClick={selectedMode === 'cb' ? pasteFromCb: next}>{selectedMode === 'cb' ? 'Paste From Clipboard' : 'Next'}</button>
  </div>
}