import { useState } from "react";
import "./App.css";
import PulseCapture from "./components/PulseCapture";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  const [view, setView] = useState("dashboard");

  return (
    <div className="app-shell">
      <div className="app-switcher">
        <button
          className={`app-tab ${view === "dashboard" ? "active" : ""}`}
          onClick={() => setView("dashboard")}
        >
          Admin dashboard
        </button>
        <button
          className={`app-tab ${view === "pulse" ? "active" : ""}`}
          onClick={() => setView("pulse")}
        >
          Pulse capture
        </button>
      </div>

      {view === "dashboard" ? <AdminDashboard /> : <PulseCapture />}
    </div>
  );
}

export default App;