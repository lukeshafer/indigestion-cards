// @refresh reload
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start";
import { Suspense } from "solid-js";
import Page from "./components/Page";
import "./app.css";

export default function App() {
  return (
    <Router
      root={Page}
    >
      <FileRoutes />
    </Router>
  );
}
