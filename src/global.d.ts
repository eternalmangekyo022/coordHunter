export {};

declare global {
  type ApiCity = "london" | "nyc" | "van" | "sgp";
  type ApiCityMap = {
    [key in ApiCity]: {
      name: string;
      url: string;
    };
  };

  type Operations = "quests" | "rockets";
  type Coord = {
    coord: string;
    distanceNext: number; // Null for the last coordinate, as there's no "next"
  };
}
