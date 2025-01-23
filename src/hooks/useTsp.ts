export default async function sortByTsp(
  coords: string[],
  { inDepth }: { inDepth: boolean } = { inDepth: false }
): Promise<Coord[]> {
  if (coords.length < 2)
    return coords.map((coord) => ({ coord, distanceNext: 0 }));

  // Find the shortest path starting from a given point
  async function calcPath(start: string): Promise<Coord[]> {
    const reorderedCoords = [start, ...coords.filter((c) => c !== start)];
    const path: Coord[] = [];
    let current = reorderedCoords[0];

    let remaining = reorderedCoords.slice(1);
    while (remaining.length > 0) {
      const { closest, distance } = findClosest(current, remaining);
      path.push({ coord: current, distanceNext: distance });
      current = closest;
      remaining = remaining.filter((c) => c !== closest);
    }

    path.push({ coord: current, distanceNext: 0 });
    return path;
  }

  // Find the closest coordinate to a given point
  function findClosest(
    current: string,
    remaining: string[]
  ): { closest: string; distance: number } {
    return remaining.reduce(
      (closest, coord) => {
        const dist = d(current, coord);
        return dist < closest.distance
          ? { closest: coord, distance: dist }
          : closest;
      },
      { closest: "", distance: Infinity }
    );
  }

  let finalPath: Coord[] = [];
  if (!inDepth) {
    finalPath = await calcPath(coords[0]);
  } else {
    let shortestDistance = Infinity;
    for (const coord of coords) {
      const path = await calcPath(coord);
      const totalDistance = path.reduce((sum, c) => sum + c.distanceNext, 0);
      if (totalDistance < shortestDistance) {
        shortestDistance = totalDistance;
        finalPath = path;
      }
    }
  }

  return finalPath;
}

function d(coord1: string, coord2: string): number {
  const R = 6371; // Earth's radius in kilometers
  const toRadians = (degrees: number): number => degrees * (Math.PI / 180);

  const [lat1, lon1] = coord1.split(",").map(Number);
  const [lat2, lon2] = coord2.split(",").map(Number);

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
