import { useEffect, useState } from 'react'
import clipboardy from 'clipboardy'

type Coord = {
  coord: string;
  distanceNext: number | null; // Null for the last coordinate, as there's no "next"
};

export default function App() {
  const [coordsInput, setCoordsInput] = useState('');
  const [ready, setReady] = useState(false);
  const [coords, setCoords] = useState<Coord[]>([]);
  const [current, setCurrent] = useState(0);


  const regex = /-?\d+\.\d+,-?\d+\.\d+/g;

  function loadCoords(val: string) {
    setCoordsInput(val)
    const matches = val.match(regex);
    setReady(matches ? (!ready ? true: true) : false)
    setCurrent(0)
    if(!matches) {
      setCoords([])
      return
    }
    clipboardy.write(matches[0]);
    sortByTsp(matches as string[]);
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


  
  function sortByTsp(coords: string[]) {
    if (coords.length < 2) {
      setCoords(coords.map(coord => ({ coord, distanceNext: null }))); // Single or empty input
      return;
    }
  
    const remaining = [...coords];
    const final: Coord[] = [];
  
    // Start with the first coordinate
    let current = remaining.shift()!;
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
      current = remaining.splice(closestIndex, 1)[0];
    }
  
    // Add the last coordinate with no "next" distance
    final.push({ coord: current, distanceNext: null });
  
    setCoords(final);
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
        console.log("Copied to clipboard:", toCopy);
  
        setCurrent(nextIndex);

    } catch (err) {
      console.error("Clipboard write failed:", err);
    }
  }

  useEffect(() => {
    window.onfocus = () => {
      next()
      return () => {
        window.onfocus = null
      }
    }
  }, [coords, current])

  return <div className='main-wrapper'>
    <input type="text" value={coordsInput} onChange={e => loadCoords(e.target.value)}/>
    <span className={`ready${ready ? ' active' : ''}`}>{ready ? 'Coords are ready, now: ' : 'No coords found, wrong input'}{coords.length ? <span className='coord'>#{current + 1} {coords[current].coord}{current === coords.length - 1 ? '': ' Next ' + (coords[current].distanceNext || 0).toFixed(2) + 'km'}</span>: null}</span>
    <button className='next-btn' onClick={next}>Next</button>
  </div>
}