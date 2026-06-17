import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as tournamentApi from "../api/tournamentApi";
import BrandTitle from "../Components/BrandTitle";

export default function TournamentsPage() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    tournamentApi.getTournaments()
      .then(setTournaments)
      .catch(() => setError("Failed to load tournaments"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this tournament?")) return;
    await tournamentApi.deleteTournament(id);
    setTournaments(prev => prev.filter(t => t._id !== id));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e5e7eb", padding: "20px 16px" }}>
      <BrandTitle size="small" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", marginTop: "10px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#f9fafb", margin: 0 }}>🏆 Tournaments</h2>
        <button
          onClick={() => navigate("/tournaments/new")}
          style={{ background: "#16a34a", color: "#fff", padding: "9px 18px", borderRadius: "8px", border: "none", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}
        >
          + New Tournament
        </button>
      </div>

      {loading && <p style={{ color: "#6b7280", textAlign: "center", marginTop: "40px" }}>Loading...</p>}
      {error && <p style={{ color: "#ef4444", textAlign: "center" }}>{error}</p>}

      {!loading && tournaments.length === 0 && (
        <div style={{ textAlign: "center", marginTop: "60px", color: "#6b7280" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏏</div>
          <p style={{ fontSize: "16px" }}>No tournaments yet.</p>
          <p style={{ fontSize: "14px" }}>Create one to get started!</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {tournaments.map(t => (
          <div
            key={t._id}
            onClick={() => navigate(`/tournaments/${t._id}`)}
            style={{
              background: "#111827",
              border: "1px solid #1f2937",
              borderRadius: "12px",
              padding: "16px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#4b5563"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#1f2937"}
          >
            <div>
              <div style={{ fontWeight: "700", fontSize: "16px", color: "#f9fafb", marginBottom: "4px" }}>{t.name}</div>
              <div style={{ fontSize: "13px", color: "#6b7280" }}>
                {t.format === "test" ? "Test Match" : `${t.overs} overs`} · {t.teams?.length || 0} teams
              </div>
              <div style={{ marginTop: "6px" }}>
                <span style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  padding: "2px 10px",
                  borderRadius: "20px",
                  background: t.status === "completed" ? "#14532d" : t.status === "ongoing" ? "#1e3a5f" : "#1f2937",
                  color: t.status === "completed" ? "#4ade80" : t.status === "ongoing" ? "#60a5fa" : "#9ca3af",
                }}>
                  {t.status === "completed" ? "Completed" : t.status === "ongoing" ? "Ongoing" : "Upcoming"}
                </span>
              </div>
            </div>
            <button
              onClick={(e) => handleDelete(t._id, e)}
              style={{ background: "transparent", border: "1px solid #374151", color: "#9ca3af", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}
            >
              🗑
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate("/home")}
        style={{ marginTop: "28px", background: "transparent", border: "1px solid #374151", color: "#6b7280", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", width: "100%" }}
      >
        ← Back to Home
      </button>
    </div>
  );
}