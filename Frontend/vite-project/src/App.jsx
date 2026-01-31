import { Routes, Route } from "react-router-dom"
import LandingPage from "./Pages/LandingPage"
import LoginPage from "./Pages/LoginPage"
import SignupPage from "./Pages/SignupPage"
import MatchSetupPage from "./Pages/MatchSetupPage"
import ScoringPage from "./Pages/ScoringPage"
import StatsPage from "./Pages/StatsPage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/setup" element={<MatchSetupPage />} />
      <Route path="/scoring" element={<ScoringPage />} />
      <Route path="/stats" element={<StatsPage />} />
    </Routes>
  )
}

export default App
