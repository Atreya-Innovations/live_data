import StateRanking from './StateRanking.jsx';
import Glossary from './Glossary.jsx';

export default function LowerGrid({ rows, filters, data }) {
  return (
    <div className="lower-grid">
      <StateRanking rows={rows} filters={filters} data={data} />
      <Glossary />
    </div>
  );
}
