import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as tournamentApi from "../api/tournamentApi";
import BrandTitle from "../Components/BrandTitle";

export default function CreateTournamentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = settings, 2 = team names
  const [name, setName] = useState("");
  const [format, setFormat] = useState("limited");
  const [overs, setOvers] = useState(20);
  const [matchDays, setMatchDays] = useState(5);
  const [oversPerDay, setOversPerDay] = useState(90);
  const [numTeams, setNumTeams] = useState(4);
  const [teamNames, setTeamNames] = useState(["", "", "", ""]);
  const [pointsWin, setPointsWin] = useState(2);
  const [pointsTie, setPointsTie] = useState(1);
  const [pointsNR, setPointsNR] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNumTeamsChange = (n) => {
    const count = Number(n);
    setNumTeams(count);
    setTeamNames(prev => {
      const updated = [...prev];
      while (updated.length < count) updated.push("");
      return updated.slice(0, count);
    });
  };

  const handleSubmit = async () => {
    if (teamNames.some(t => !t.trim())) {
      setError("All team names are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        name: name.trim(),
        format,
        overs: format === "limited" ? Number(overs) : undefined,
        matchDays: format === "test" ? Number(matchDays) : undefined,
        oversPerDay: format === "test" ? Number(oversPerDay) : undefined,
        teams: teamNames.map(t => t.trim()),
        pointsRules: { win: pointsWin, tie: pointsTie, nr: pointsNR },
      };
      const tournament = await tournamentApi.createTournament(payload);
      navigate(`/tournaments/${tournament._id}`);
    } catch (err) {
      setError(err.message || "Failed to create tournament");
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", background: "#111827", border: "1px solid #374151",
    color: "#f9fafb", padding: "10px 12px", borderRadius: "8px",
    fontSize: "14px", boxSizing: "border-box",
  };
  const labelStyle = { fontSize: "13px", color: "#9ca3af", marginBottom: "6px", display: "block" };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e5e7eb", padding: "20px 16px" }}>
      <BrandTitle size="small" />
      <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#f9fafb", margin: "12px 0 20px" }}>🏆 Create Tournament</h2>

      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Tournament Name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mohalla Cup 2026" />
          </div>

          <div>
            <label style={labelStyle}>Format</label>
            <div style={{ display: "flex", gap: "10px" }}>
              {["limited", "test"].map(f => (
                <button key={f} onClick={() => setFormat(f)} style={{
                  flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${format === f ? "#16a34a" : "#374151"}`,
                  background: format === f ? "#14532d" : "#111827", color: format === f ? "#4ade80" : "#9ca3af",
                  fontWeight: "600", cursor: "pointer", fontSize: "14px"
                }}>
                  {f === "limited" ? "🏏 Limited Overs" : "📅 Test Match"}
                </button>
              ))}
            </div>
          </div>

          {format === "limited" && (
            <div>
              <label style={labelStyle}>Overs per innings</label>
              <input type="number" style={inputStyle} value={overs} onChange={e => setOvers(e.target.value)} min={1} />
            </div>
          )}
          {format === "test" && (
            <>
              <div>
                <label style={labelStyle}>Match Days</label>
                <input type="number" style={inputStyle} value={matchDays} onChange={e => setMatchDays(e.target.value)} min={1} />
              </div>
              <div>
                <label style={labelStyle}>Overs per Day</label>
                <input type="number" style={inputStyle} value={oversPerDay} onChange={e => setOversPerDay(e.target.value)} min={1} />
              </div>
            </>
          )}

          <div>
            <label style={labelStyle}>Number of Teams</label>
            <input type="number" style={inputStyle} value={numTeams} onChange={e => handleNumTeamsChange(e.target.value)} min={2} max={16} />
          </div>

          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "10px", padding: "14px" }}>
            <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "10px", fontWeight: "600" }}>Points Rules</div>
            <div style={{ display: "flex", gap: "10px" }}>
              {[["Win", pointsWin, setPointsWin], ["Tie/NR", pointsTie, setPointsTie], ["Loss", 0, null]].map(([label, val, setter]) => (
                <div key={label} style={{ flex: 1 }}>
                  <label style={{ ...labelStyle, textAlign: "center" }}>{label}</label>
                  <input
                    type="number"
                    style={{ ...inputStyle, textAlign: "center" }}
                    value={val}
                    onChange={setter ? e => setter(Number(e.target.value)) : undefined}
                    readOnly={!setter}
                    min={0}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              if (!name.trim()) { setError("Tournament name is required."); return; }
              setError("");
              setStep(2);
            }}
            style={{ background: "#16a34a", color: "#fff", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "700", fontSize: "15px", cursor: "pointer", marginTop: "4px" }}
          >
            Next → Enter Team Names
          </button>
          {error && <p style={{ color: "#ef4444", fontSize: "13px", textAlign: "center" }}>{error}</p>}
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Enter names for all {numTeams} teams:</p>
          {teamNames.map((t, i) => (
            <div key={i}>
              <label style={labelStyle}>Team {i + 1}</label>
              <input
                style={inputStyle}
                value={t}
                onChange={e => {
                  const updated = [...teamNames];
                  updated[i] = e.target.value;
                  setTeamNames(updated);
                }}
                placeholder={`Team ${i + 1} name`}
              />
            </div>
          ))}
          {error && <p style={{ color: "#ef4444", fontSize: "13px", textAlign: "center" }}>{error}</p>}
          <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
            <button onClick={() => setStep(1)} style={{ flex: 1, background: "#1f2937", color: "#9ca3af", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer" }}>
              ← Back
            </button>
            <button onClick={handleSubmit} disabled={loading} style={{ flex: 2, background: loading ? "#374151" : "#16a34a", color: "#fff", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "700", fontSize: "15px", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Creating..." : "🏆 Create Tournament"}
            </button>
          </div>
        </div>
      )}

      <button onClick={() => navigate("/tournaments")} style={{ marginTop: "20px", background: "transparent", border: "1px solid #374151", color: "#6b7280", padding: "10px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", width: "100%" }}>
        ← Cancel
      </button>
    </div>
  );
}