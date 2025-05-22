import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Team from "./pages/Team";
import Projects from "./pages/Projects";
import Donation from "./pages/Donation";
import Header from "./components/Header";

import "./styles/App.css";

function App() {
    return (
        <Router>
            <Header />
            <Routes>
                <Route
                    path="/"
                    element={<Home />}
                />
                <Route
                    path="/team"
                    element={<Team />}
                />
                <Route
                    path="/projects"
                    element={<Projects />}
                />
                <Route
                    path="/donation"
                    element={<Donation />}
                />
            </Routes>
        </Router>
    );
}

export default App;
