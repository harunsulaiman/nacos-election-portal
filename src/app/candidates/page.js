"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import '../styles.css';
import Footer from '../components/footer';
import { API_BASE_URL } from "../app/config";

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState('');

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
      } catch (err) {
        setError('Error connecting to the server.');
      }
    };
    fetchCandidates();
  }, []);

  const positions = [...new Set(candidates.map((c) => c.position))];

  return (
    <div className="container">
      <h1 className="page-title">Meet Our Candidates</h1>
      <p className="page-subtitle">
        Discover the vision and passion of our candidates for the 2025 NACOS election.
      </p>

      {error && <p className="error-message">{error}</p>}

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
                  <h3 className="candidate-name">{candidate.name}</h3>
                  <p className="candidate-bio">{candidate.bio}</p>
                </div>
              ))}
          </div>
        </div>
      ))}

      <Link href="/vote" className="vote-now-btn">
        Vote Now
      </Link>

      <Footer />
    </div>
  );
}
