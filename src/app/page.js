import Link from 'next/link';
import './styles.css';

export default function Home() {
  return (
    <div className="landing-container">
      <div className="hero">
        <h1 className="hero-title">NACOS 2026 EXCO ELECTION PORTAL</h1>
        <p className="hero-subtitle">
          Vote for the future of NACOS
        </p>
        <div className="hero-content">
          <p>
            The <strong>National Association of Computing Students (NACOS)</strong> is about 
            to hold its Annual Election for Executives for the 2025 Session.

            Time to vote for the next Executive 2026.
          </p>
          <p>
            Join us in shaping the future of NACOS through our annual
            departmental elections, where you choose leaders to represent and inspire.
          </p>
        </div>
        <div className="cta-buttons">
          <Link href="/candidates" className="cta-btn">
            Meet the Candidates
          </Link>
          <Link href="/vote" className="cta-btn cta-btn-secondary">
            Cast Your Vote
          </Link>
        </div>
      </div>
      <div className="wave"></div>
    </div>
  );
}


