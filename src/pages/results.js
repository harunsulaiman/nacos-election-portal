
  "use client";

  import { useState, useEffect } from 'react';
  import '../pages/results.css';
  import Footer from '../app/components/footer';

  export default function Results() {
    const [votes, setVotes] = useState({});
    const [candidates, setCandidates] = useState([]);
    const [error, setError] = useState('');
    const [electionStatus, setElectionStatus] = useState('pending');

    useEffect(() => {
      const fetchCandidates = async () => {
        try {
          const res = await fetch('http://localhost:3001/api/candidates');
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
          const res = await fetch('http://localhost:3001/api/results');
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

      const fetchElectionStatus = async () => {
        try {
          const res = await fetch('http://localhost:3001/api/election-status');
          if (res.ok) {
            const data = await res.json();
            setElectionStatus(data.status);
            if (data.status === 'pending') {
              setError('Election has not started yet. Results are not available.');
            }
          } else {
            setError('Failed to fetch election status.');
          }
        } catch (err) {
          setError('Error connecting to the server.');
        }
      };

      fetchCandidates();
      fetchResults();
      fetchElectionStatus();
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
                    .map((candidate) => (
                      <div key={candidate.id} className="result-item">
                        <span>{candidate.name}</span>
                        <div
                          className="vote-bar"
                          style={{ '--vote-width': (votes[position]?.[candidate.id] || 0) * 10 + '%' }}
                        >
                          {votes[position]?.[candidate.id] || 0} votes
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <Footer />
      </div>
    );
  }
  