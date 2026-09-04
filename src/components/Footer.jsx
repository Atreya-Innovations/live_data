export default function Footer({ count, status }) {
  const isLive = status && (status.includes('Live from') || status.includes('refreshed'));
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <span className="footer-divider"></span>
      <p>
        Built for <span className="footer-brand">Atreya Innovations</span> &mdash; Nadi Tarangini device network visualization.
      </p>
      <p style={{ marginTop: 4, fontSize: 11, opacity: 0.7 }}>
        &copy; {year} Atreya Innovations Pvt. Ltd. All rights reserved.
      </p>
      <div className="live-badge">
        {isLive && <span className="live-dot"></span>}
        {isLive ? 'Live' : 'Offline'} device export &mdash; auto-refreshed every 5 minutes
        {count ? ` (${count.toLocaleString()} readings)` : ''}
      </div>
    </footer>
  );
}
