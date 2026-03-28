function NoResultBanner() {
    return (
      <div style={{ textAlign: "center", marginTop: "24px", padding: "20px", background: "#1a0a2e", borderRadius: "12px", border: "2px solid #8e44ad" }}>
        <p style={{ fontSize: "28px", fontWeight: "bold", color: "#8e44ad", margin: 0 }}>🌧️ NO RESULT</p>
        <p style={{ color: "#ccc", marginTop: "8px" }}>Match ended without a result</p>
      </div>
    );
  }
  
  export default NoResultBanner;