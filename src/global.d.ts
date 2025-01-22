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
}
