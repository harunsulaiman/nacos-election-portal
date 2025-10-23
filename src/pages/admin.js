"use client";

import { useState, useEffect } from 'react';
import '../pages/admin.css';
import { API_BASE_URL } from './app/config'; // ✅ import shared base URL

export default function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [votes, setVotes] = useState({});
  const [candidates, setCandidates] = useState([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/candidates`);
        if (res.ok) {
          setCandidates(await res.json());
        } else {
          setError('Failed to load candidates.');
        }
      } catch (err) {
        setError('Error connecting to the server.');
      }
    };

    const fetchElectionConfig = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/election-status`);
        if (res.ok) {
          const config = await fetch(`${API_BASE_URL}/api/election-config`);
          if (config.ok) {
            const data = await config.json();
            setStartTime(data.startTime.slice(0, 16));
            setEndTime(data.endTime.slice(0, 16));
          } else {
            setError('Failed to load election config.');
          }
        } else {
          setError('Failed to fetch election status.');
        }
      } catch (err) {
        setError('Error connecting to the server.');
      }
    };

    fetchCandidates();
    if (isAuthenticated) fetchElectionConfig();
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (password === 'admin123') {
      setIsAuthenticated(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/api/results`);
        if (res.ok) {
          setVotes((await res.json()).votes);
        } else {
          setError('Failed to load results.');
        }
      } catch (err) {
        setError('Error connecting to the server.');
      }
    } else {
      setError('Invalid password.');
    }
  };

  const handleVoteChange = (position, candidateId, value) => {
    setVotes((prev) => ({
      ...prev,
      [position]: {
        ...prev[position],
        [candidateId]: parseInt(value) || 0,
      },
    }));
  };

  const handleSaveVotes = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/update-votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ votes, adminPassword: password }),
      });
      if (res.ok) {
        setError('');
        alert('Votes updated successfully!');
      } else {
        setError('Failed to update votes.');
      }
    } catch (err) {
      setError('Error connecting to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/update-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime, endTime, adminPassword: password }),
      });
      if (res.ok) {
        setError('');
        alert('Election times updated successfully!');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update election times.');
      }
    } catch (err) {
      setError('Error connecting to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const positions = [...new Set(candidates.map((c) => c.position))];

  return (
    <div className="container">
      <h1 className="page-title">NACOS Election Admin</h1>
      {!isAuthenticated ? (
        <div className="admin-login">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="password-input"
          />
          <button onClick={handleLogin} className="submit-button">
            Login
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>
      ) : (
        <div className="admin-panel">
          {error && <p className="error-message">{error}</p>}

          <div className="config-section">
            <h3 className="section-subtitle">Election Schedule</h3>
            <div className="config-item">
              <label>Start Time:</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="config-input"
              />
            </div>
            <div className="config-item">
              <label>End Time:</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="config-input"
              />
            </div>
            <button
              onClick={handleSaveConfig}
              disabled={isSubmitting}
              className="submit-button"
            >
              {isSubmitting ? 'Saving...' : 'Save Election Times'}
            </button>
          </div>

          <div className="vote-section">
            <h3 className="section-subtitle">Manage Votes</h3>
            {positions.map((position) => (
              <div key={position}>
                <h4 className="section-subtitle">{position}</h4>
                {candidates
                  .filter((c) => c.position === position)
                  .map((candidate) => (
                    <div key={candidate.id} className="vote-item">
                      <span>{candidate.name}</span>
                      <input
                        type="number"
                        min="0"
                        value={votes[position]?.[candidate.id] || 0}
                        onChange={(e) =>
                          handleVoteChange(position, candidate.id, e.target.value)
                        }
                        className="vote-input"
                      />
                    </div>
                  ))}
              </div>
            ))}
            <button
              onClick={handleSaveVotes}
              disabled={isSubmitting}
              className="submit-button"
            >
              {isSubmitting ? 'Saving...' : 'Save Vote Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
