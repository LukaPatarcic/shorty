import { StatsPage } from "~/stats/stats";
import type { Route } from "./+types/stats";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "URL Statistics - Shorty" },
    { name: "description", content: "View statistics for your shortened URL" },
  ];
}

export default function StatsRoute() {
  return <StatsPage />;
} 