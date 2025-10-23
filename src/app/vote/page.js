"use client";

import { useState, useEffect, useCallback } from 'react';
import '../styles.css';
import Footer from '../components/footer';

export default function Vote() {
  const [voterId, setVoterId] = useState('');
  const [isEligible, setIsEligible] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState({});
  const [hasVoted, setHasVoted] = useState({});
  const [votes, setVotes] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/candidates'); // Replace with 'https://nacos-backend.onrender.com/api/candidates' after deployment
        if (res.ok) {
          const data = await res.json();
          setCandidates(data);
        } else {
          setError('Failed to load candidates.');
        }
      } catch (err) {
        setError('Error connecting to the server.');
      }
    };

    const fetchResults = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/results'); // Replace with 'https://nacos-backend.onrender.com/api/results' after deployment
        if (res.ok) {
          const data = await res.json();
          setVotes(data.votes);
        } else {
          setError('Failed to fetch election results.');
        }
      } catch (err) {
        setError('Error connecting to the server.');
      }
    };

    fetchCandidates();
    fetchResults();
  }, []);

  const handleVoterIdSubmit = useCallback(async () => {
    if (!voterId.trim()) {
      setError('Please enter a valid departmental ID.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:3001/api/validate-voter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId: voterId.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.isEligible) {
        setIsEligible(true);
        setHasVoted(data.hasVoted || {});
        setError('');
      } else {
        setError(data.error || 'Only candidates with a valid departmental ID can vote.');
        setIsEligible(false);
      }
    } catch (err) {
      setError('Error connecting to the server.');
    } finally {
      setIsSubmitting(false);
    }
  }, [voterId]);

  const handleVote = useCallback(async () => {
    if (!isEligible) {
      setError('Please verify your departmental ID first.');
      return;
    }
    const positions = Object.keys(selectedCandidates);
    if (positions.length === 0 || positions.every((pos) => !selectedCandidates[pos])) {
      setError('Please select at least one candidate.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:3001/api/submit-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId, selectedCandidates }),
      });
      const data = await res.json();
      if (res.ok) {
        setVotes(data.votes);
        setHasVoted(data.hasVoted[voterId]);
        setShowResults(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        setError('');
      } else {
        setError(data.error || 'Vote submission failed.');
      }
    } catch (err) {
      setError('Error connecting to the server.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isEligible, selectedCandidates, voterId]);

  const handleReset = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:3001/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const initializedVotes = candidates.reduce((acc, candidate) => {
          if (!acc[candidate.position]) acc[candidate.position] = {};
          acc[candidate.position][candidate.id] = 0;
          return acc;
        }, {});
        setVotes(initializedVotes);
        setHasVoted({});
        setSelectedCandidates({});
        setShowResults(false);
        setVoterId('');
        setIsEligible(false);
        setError('');
      } else {
        setError('Failed to reset election.');
      }
    } catch (err) {
      setError('Error connecting to the server.');
    } finally {
      setIsSubmitting(false);
    }
  }, [candidates]);

  const positions = [...new Set(candidates.map((c) => c.position))];

  return (
    <div className="container">
      {showConfetti && <div className="confetti"></div>}
      <h1 className="page-title">NACOS Election Voting</h1>
      {error && <p className="error-message">{error}</p>}
      {!isEligible ? (
        <div className="voter-id-section">
          <p className="section-subtitle">Enter your  departmental ID NUMBER:</p>
          <input
            type="text"
            value={voterId}
            onChange={(e) => setVoterId(e.target.value)}
            placeholder="e.g., 22/08/05/0001"
            className="voter-id-input"
          />
          <button
            className="cta-btn"
            onClick={handleVoterIdSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verifying...' : 'Verify ID'}
          </button>
        </div>
      ) : (
        <>
          <p className="section-subtitle">Candidate ID: {voterId}</p>
          {positions.map((position) => (
            <div key={position} className="position-section">
              <h2 className="section-title">{position}</h2>
              <div className="candidate-grid">
                {candidates
                  .filter((c) => c.position === position)
                  .map((candidate) => (
                    <div key={candidate.id} className="candidate-card">
                      <img
                        src={candidate.avatar}
                        alt={candidate.name}
                        className="candidate-avatar"
                      />
                      <div className="candidate-info">
                        <input
                          type="radio"
                          name={position}
                          value={candidate.id}
                          disabled={hasVoted[position]}
                          onChange={() =>
                            setSelectedCandidates({
                              ...selectedCandidates,
                              [position]: parseInt(candidate.id),
                            })
                          }
                          checked={selectedCandidates[position] === candidate.id}
                          className="candidate-radio"
                        />
                        <label className="candidate-label">{candidate.name}</label>
                      </div>
                    </div>
                  ))}
              </div>
              {hasVoted[position] && (
                <p className="vote-message">Voted for {position}!</p>
              )}
            </div>
          ))}
          <button
            className={`vote-btn ${
              Object.keys(hasVoted).length === positions.length || isSubmitting ? 'disabled' : ''
            }`}
            onClick={handleVote}
            disabled={Object.keys(hasVoted).length === positions.length || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Votes'}
          </button>
          {showResults && (
            <div className="results-section">
              <h2 className="section-title">Election Results</h2>
              {positions.map((position) => (
                <div key={position}>
                  <h3 className="section-subtitle">{position}</h3>
                  <div className="results">
                    {candidates
                      .filter((c) => c.position === position)
                      .map((candidate) => (
                        <div key={candidate.id} className="result-item">
                          <span>{candidate.name}</span>
                          <div
                            className="vote-bar"
                            style={{ width: `${(votes[position]?.[candidate.id] || 0) * 10}%` }}
                          >
                            {votes[position]?.[candidate.id] || 0} votes
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
              <button
                className="reset-btn"
                onClick={handleReset}
                disabled={isSubmitting}
              >
                Reset Election
              </button>
            </div>
          )}
        </>
      )}
      <Footer />
    </div>
  );
}