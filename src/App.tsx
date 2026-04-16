import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

const Dashboard = lazy(() => import("./pages/Dashboard"));

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<div>Loading dashboard...</div>}>
              <Dashboard />
            </Suspense>
          }
        />
      </Routes>
    </HashRouter>
  );
}

export default App;