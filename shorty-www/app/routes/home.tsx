import type { Route } from "./+types/home";
import { MainPage } from "../home/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Shorty" },
    { name: "description", content: "Shorty is a URL shortening service" },
  ];
}

export default function HomeRoute() {
  return <MainPage />;
}
