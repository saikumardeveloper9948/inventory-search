import { useState, useEffect, useCallback } from 'react';
import SearchBar from './components/SearchBar';
import CategoryDropdown from './components/CategoryDropdown';
import PriceRange from './components/PriceRange';
import InventoryTable from './components/InventoryTable';
import './App.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [priceError, setPriceError] = useState('');

  const fetchResults = useCallback(async () => {
    if (minPrice !== '' && maxPrice !== '') {
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (!isNaN(min) && !isNaN(max) && min > max) {
        setPriceError('Min price must be \u2264 max price');
        return;
      }
    }
    setPriceError('');
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCategory && selectedCategory !== 'All') params.set('category', selectedCategory);
    if (minPrice !== '') params.set('minPrice', minPrice);
    if (maxPrice !== '') params.set('maxPrice', maxPrice);

    try {
      const res = await fetch('/api/search?' + params.toString());
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Search failed');
      }
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, minPrice, maxPrice]);

  useEffect(() => {
    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [fetchResults]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Inventory Search</h1>
        <p>Search and filter products across all suppliers</p>
      </header>

      <main className="app-main">
        <section className="filters-panel">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <CategoryDropdown value={selectedCategory} onChange={setSelectedCategory} />
          <PriceRange
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMinChange={setMinPrice}
            onMaxChange={setMaxPrice}
            error={priceError}
          />
        </section>

        {error && <p className="api-error">Warning: {error}</p>}

        <section className="results-section">
          <InventoryTable results={results} loading={loading} />
        </section>
      </main>
    </div>
  );
}

export default App;
