"use client";

import { useState, useEffect } from 'react';
import '../pages/results.css';
import Footer from '../app/components/footer';
import { API_BASE_URL } from '../config'; // ✅ Import your backend base URL

export default function Results() {
  const [votes, setVotes] = useState({});
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState('');
  const [electionStatus, setElectionStatus] = useState('pending');

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/candidates`);
        if (res.ok) {
          const data = await res.json();
          setCandidates(data);
        } else {
          setError('Failed to load candidates.');
        }
      } catch {
        setError('Error connecting to the server.');
      }
    };

    const fetchResults = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/results`);
        if (res.ok) {
          const data = await res.json();
          setVotes(data.votes);
        } else {
          setError('Failed to fetch election results.');
        }
      } catch {
        setError('Error connecting to the server.');
      }
    };

    const fetchElectionStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/election-status`);
        if (res.ok) {
          const data = await res.json();
          setElectionStatus(data.status);
          if (data.status === 'pending') {
            setError('Election has not started yet. Results are not available.');
          }
        } else {
          setError('Failed to fetch election status.');
        }
      } catch {
        setError('Error connecting to the server.');
      }
    };

    fetchCandidates();
    fetchResults();
    fetchElectionStatus();

    // Re-fetch votes every 5 seconds for live updates
    const interval = setInterval(fetchResults, 5000);
    return () => clearInterval(interval);
  }, []);

  const positions = [...new Set(candidates.map((c) => c.position))];

  return (
    <div className="container">
      <h1 className="page-title">NACOS Election Results</h1>
      {error && <p className="error-message">{error}</p>}
      {electionStatus !== 'pending' && (
        <div className="results-section">
          {positions.map((position) => (
            <div key={position}>
              <h3 className="section-subtitle">{position}</h3>
              <div className="results">
                {candidates
                  .filter((c) => c.position === position)
                  .map((candidate) => {
                    const voteCount = votes[position]?.[candidate.id] || 0;
                    const totalVotes = Object.values(votes[position] || {}).reduce(
                      (a, b) => a + b,
                      0
                    );
                    const widthPercent =
                      totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

                    return (
                      <div key={candidate.id} className="result-item">
                        <span className="candidate-name">{candidate.name}</span>
                        <div className="vote-bar">
                          <div
                            className="vote-fill"
                            style={{ width: `${widthPercent}%` }}
                          >
                            <span className="vote-count">{voteCount}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}
      <Footer />
    </div>
  );
}
