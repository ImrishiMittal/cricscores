import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LandingPage from "./Pages/LandingPage";
import LoginPage from "./Pages/LoginPage";
import SignupPage from "./Pages/SignupPage";
import MatchSetupPage from "./Pages/MatchSetupPage";
import ScoringPage from "./Pages/ScoringPage";
import StatsPage from "./Pages/StatsPage";
import HomePage from "./Pages/HomePage";
import PlayerDetailPage from "./Pages/PlayerDetailPage";
import MatchHistoryPage from "./Pages/MatchHistoryPage";
import TournamentsPage from "./Pages/TournamentsPage";
import CreateTournamentPage from "./Pages/CreateTournamentPage";
import TournamentDashboardPage from "./Pages/TournamentDashboardPage";
import SquadManagerPage from "./Pages/SquadManagerPage";
import PublicTournamentPage from "./Pages/PublicTournamentPage";
import HeadToHeadPage from "./Pages/HeadToHeadPage";

const router = createBrowserRouter([
  { path: "/",                        element: <LandingPage /> },
  { path: "/login",                   element: <LoginPage /> },
  { path: "/signup",                  element: <SignupPage /> },
  { path: "/setup",                   element: <MatchSetupPage /> },
  { path: "/scoring",                 element: <ScoringPage /> },
  { path: "/stats",                   element: <StatsPage /> },
  { path: "/home",                    element: <HomePage /> },
  { path: "/player/:jersey",          element: <PlayerDetailPage /> },
  { path: "/history",                 element: <MatchHistoryPage /> },
  { path: "/tournaments",             element: <TournamentsPage /> },
  { path: "/tournaments/new",         element: <CreateTournamentPage /> },
  { path: "/tournaments/:id",         element: <TournamentDashboardPage /> },
  { path: "/squads",                  element: <SquadManagerPage /> },
  { path: "/t/:shareId",              element: <PublicTournamentPage /> },
  { path: "/head-to-head", element: <HeadToHeadPage /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;