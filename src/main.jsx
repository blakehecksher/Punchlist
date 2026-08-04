import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PunchListApp from "./PunchListApp.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PunchListApp />
  </StrictMode>
);
