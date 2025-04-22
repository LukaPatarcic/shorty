import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("stats/:code", "routes/stats.tsx")
] satisfies RouteConfig;
