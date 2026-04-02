import { useState, useEffect, useRef } from "react";
import styles from "./CaptainSearch.module.css";
import usePlayerDatabase from "../../hooks/usePlayerDatabase";

/**
 * CaptainSearch
 * Autocomplete input that searches the player database by name or jersey.
 * If no match found, shows "Add New Captain" option that opens a mini-form.
 * On selection/creation it returns { jersey, name } via onSelect.
 * Displays the selected player as "#{jersey} - {name}" in the input.
 */
function CaptainSearch({ placeholder, onSelect, value }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [showNewCaptainForm, setShowNewCaptainForm] = useState(false);
  const [newJersey, setNewJersey] = useState("");
  const [newName, setNewName] = useState("");
  const [formError, setFormError] = useState("");
  const wrapperRef = useRef(null);
  const playerDB = usePlayerDatabase();

  // When a value is already set (e.g. from parent state), show it in the input
  useEffect(() => {
    if (value?.name && value?.jersey) {
      setQuery(`#${value.jersey} - ${value.name}`);
    } else {
      setQuery("");
    }
  }, [value?.jersey, value?.name]);

  // Load and filter from localStorage player database
  useEffect(() => {
    const term = query.trim().toLowerCase();

    // If the query matches the currently selected display string, don't re-search
    if (value?.name && value?.jersey) {
      const displayStr = `#${value.jersey} - ${value.name}`.toLowerCase();
      if (term === displayStr) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
    }

    if (!term) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestion(-1);
      return;
    }

    const raw = localStorage.getItem("cricket_player_database");
    const db = raw ? JSON.parse(raw) : {};
    const players = Object.values(db);

    const matched = players.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(term);
      const jerseyMatch = String(p.jersey).startsWith(term);
      return nameMatch || jerseyMatch;
    });

    matched.sort((a, b) => {
      const aExact =
        a.name.toLowerCase() === term || String(a.jersey) === term;
      const bExact =
        b.name.toLowerCase() === term || String(b.jersey) === term;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.name.localeCompare(b.name);
    });

    const top = matched.slice(0, 6);
    setSuggestions(top);
    setShowSuggestions(top.length > 0 || term.length > 0); // Show dropdown even if no matches
    setActiveSuggestion(-1);
  }, [query, value]);

  // Close on outside click
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setShowNewCaptainForm(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const handleSelect = (player) => {
    setQuery(`#${player.jersey} - ${player.name}`);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
    onSelect({ jersey: String(player.jersey), name: player.name });
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    setShowNewCaptainForm(false); // Close form when typing
    // If user edits after a selection, clear the parent value
    if (value?.jersey) onSelect(null);
  };

  const handleKeyDown = (e) => {
    if (showNewCaptainForm) return; // Don't handle keys when form is open
    if (!showSuggestions || (suggestions.length === 0 && query.trim().length === 0)) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const maxIdx = suggestions.length > 0 ? suggestions.length : 0; // +1 for "Add New" option
      setActiveSuggestion((prev) => (prev < maxIdx ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeSuggestion >= 0 && activeSuggestion < suggestions.length) {
        handleSelect(suggestions[activeSuggestion]);
      } else if (activeSuggestion === suggestions.length) {
        // "Add New Captain" option selected
        handleAddNewClick();
      } else if (suggestions.length === 1) {
        handleSelect(suggestions[0]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setShowNewCaptainForm(false);
    }
  };

  const handleAddNewClick = () => {
    setShowSuggestions(false);
    setNewJersey("");
    setNewName(query.trim());
    setFormError("");
    // Use setTimeout to let the mousedown/blur cycle finish before showing form
    setTimeout(() => setShowNewCaptainForm(true), 0);
  };

  const handleCreateNewCaptain = () => {
    setFormError("");

    if (!newJersey.trim()) {
      setFormError("⚠️ Please enter jersey number");
      return;
    }
    if (!newName.trim()) {
      setFormError("⚠️ Please enter captain name");
      return;
    }

    // Check if jersey already exists
    const existing = playerDB.getPlayer(newJersey.trim());
    if (existing) {
      setFormError(`⚠️ Jersey #${newJersey.trim()} already belongs to ${existing.name}`);
      return;
    }

    // Create new player in database
    const captain = {
      jersey: newJersey.trim(),
      name: newName.trim(),
    };

    playerDB.createOrGetPlayer(captain.jersey, captain.name);

    // Select the new captain
    setQuery(`#${captain.jersey} - ${captain.name}`);
    setShowNewCaptainForm(false);
    onSelect(captain);
  };
  console.log("showNewCaptainForm:", showNewCaptainForm);

  const highlightMatch = (text, q) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className={styles.highlight}>
          {text.slice(idx, idx + q.length)}
        </span>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const rawTerm = query.trim().toLowerCase();

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.inputBox}>
        <input
          className={styles.input}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 || query.trim().length > 0) {
              setShowSuggestions(true);
            }
          }}
          autoComplete="off"
        />
        {query.length > 0 && (
          <button
            className={styles.clearBtn}
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery("");
              setSuggestions([]);
              setShowSuggestions(false);
              setShowNewCaptainForm(false);
              onSelect(null);
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && !showNewCaptainForm && (
        <div className={styles.dropdown}>
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((p, i) => (
                <div
                  key={p.jersey}
                  className={`${styles.item} ${
                    i === activeSuggestion ? styles.active : ""
                  }`}
                  onMouseDown={() => handleSelect(p)}
                  onMouseEnter={() => setActiveSuggestion(i)}
                >
                  <span className={styles.jersey}>
                    #{highlightMatch(String(p.jersey), rawTerm)}
                  </span>
                  <span className={styles.name}>
                    {highlightMatch(p.name, rawTerm)}
                  </span>
                  <span className={styles.meta}>
                    {p.matches || 0} matches · {p.runs || 0} runs
                  </span>
                </div>
              ))}
              <div
                className={`${styles.item} ${styles.addNew} ${
                  activeSuggestion === suggestions.length ? styles.active : ""
                }`}
                onMouseDown={handleAddNewClick}
                onMouseEnter={() => setActiveSuggestion(suggestions.length)}
              >
                <span className={styles.addNewIcon}>➕</span>
                <span className={styles.addNewText}>Add New Captain</span>
              </div>
            </>
          ) : (
            <div
              className={`${styles.item} ${styles.addNew}`}
              onMouseDown={handleAddNewClick}
            >
              <span className={styles.addNewIcon}>➕</span>
              <span className={styles.addNewText}>No match found - Add New Captain</span>
            </div>
          )}
        </div>
      )}

      {/* New Captain Form */}
      {showNewCaptainForm && (
        <div className={styles.newCaptainForm}>
          <div className={styles.formHeader}>
            <span>➕ Add New Captain</span>
            <button
              className={styles.formCloseBtn}
              onClick={() => setShowNewCaptainForm(false)}
            >
              ✕
            </button>
          </div>

          <input
            className={styles.formInput}
            type="number"
            placeholder="Jersey Number (e.g. 18)"
            value={newJersey}
            onChange={(e) => setNewJersey(e.target.value)}
            autoFocus
          />

          <input
            className={styles.formInput}
            type="text"
            placeholder="Captain Name (e.g. Virat Kohli)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateNewCaptain();
            }}
          />

          {formError && <div className={styles.formError}>{formError}</div>}

          <button
            className={styles.formSubmitBtn}
            onClick={handleCreateNewCaptain}
          >
            Add Captain
          </button>
        </div>
      )}
    </div>
  );
}

export default CaptainSearch;
