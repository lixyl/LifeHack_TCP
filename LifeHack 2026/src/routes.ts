import { createBrowserRouter } from "react-router-dom";
import Root from "./Root";
import Home from "./pages/Home";
import Results from "./pages/Results";
import Challenge from "./pages/Challenge";
import Refine from "./pages/Refine";
import Output from "./pages/Output";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "results", Component: Results },
      { path: "challenge", Component: Challenge },
      { path: "refine", Component: Refine },
      { path: "output", Component: Output },
    ],
  },
]);
