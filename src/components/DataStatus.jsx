export default function DataStatus({ status }) {
  const isLive = status.includes('Live from') || status.includes('refreshed');
  const isCached = status.includes('Cached');
  const isLoading = status.includes('Loading') || status.includes('Fetching') || status.includes('Connecting');

  const dotClass = isLive ? 'live' : isCached ? 'cached' : 'loading';

  return (
    <div id="data-status">
      <span className={`status-dot ${dotClass}`}></span>
      {isLoading && !isLive ? (
        <span className="status-shimmer" aria-label="Loading data"></span>
      ) : (
        <span>{status}</span>
      )}
    </div>
  );
}
