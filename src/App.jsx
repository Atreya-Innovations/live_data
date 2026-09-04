import { useMemo, useState, useCallback, Component } from 'react';
import { useGoogleSheet } from './hooks/useGoogleSheet.js';
import { PARAM_DEFS } from './constants/paramDefs.js';
import { getFilteredRows } from './utils/filterUtils.js';
import Header from './components/Header.jsx';
import Controls from './components/Controls.jsx';
import DataStatus from './components/DataStatus.jsx';
import StatsRow from './components/StatsRow.jsx';
import MapPanel from './components/MapPanel/MapPanel.jsx';
import LowerGrid from './components/LowerGrid/LowerGrid.jsx';
import Footer from './components/Footer.jsx';

const DEFAULT_FILTERS = {
  param: PARAM_DEFS[0]?.key || 'age',
  catValue: '',
  state: '__all__',
  country: '__all__',
  ageCategories: [],
  praharIds: [],
  bmiIds: [],
};

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="error-card">
          <span className="error-icon">⚠️</span>
          <h2>Something went wrong</h2>
          <p>The dashboard encountered an unexpected error. This is usually temporary — try reloading the page.</p>
          <pre>{String(this.state.error?.message || this.state.error)}</pre>
          <button onClick={() => window.location.reload()}>Reload Dashboard</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const { data, status } = useGoogleSheet();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const handleFilterChange = useCallback((next) => {
    setFilters(next);
  }, []);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const rows = useMemo(() => {
    if (!data || !data.rows) return [];
    try {
      return getFilteredRows(data.rows, data.states, data.countries || [], filters);
    } catch (e) {
      console.error('Filter error:', e);
      return data.rows;
    }
  }, [data, filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.state !== '__all__') count++;
    if (filters.country !== '__all__') count++;
    if (filters.ageCategories.length) count++;
    if (filters.praharIds.length) count++;
    if (filters.bmiIds.length) count++;
    return count;
  }, [filters]);

  return (
    <ErrorBoundary>
      <div className="app-enter">
        <Header />
        <div className="wrap">
          <div className="subheader">
            <h2>India Device Data Heatmap</h2>
            <p>
              Live geographic view of Nadi Tarangini device readings across India, drawn as a continuous weather-style
              field at every zoom level: every point on the map is interpolated from the readings around it, so regions
              with no device of their own still carry an estimate.
            </p>
          </div>
          {data && (
            <Controls
              data={data}
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleReset}
              activeFilterCount={activeFilterCount}
            />
          )}
          <DataStatus status={status} />
          <StatsRow rows={rows} filters={filters} data={data} />
          <MapPanel rows={rows} filters={filters} data={data} />
          <LowerGrid rows={rows} filters={filters} data={data} />
          <Footer count={data ? data.rows.length : 0} status={status} />
        </div>
      </div>
    </ErrorBoundary>
  );
}
