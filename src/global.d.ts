export {};

declare global {
  type ApiCity = "london" | "nyc" | "van" | "sgp";
  type ApiCityMap = {
    [key in ApiCity]: string;
  };

  type Operations = "quests" | "rockets";
}
