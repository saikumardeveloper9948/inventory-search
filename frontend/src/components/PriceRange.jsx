export default function PriceRange({ minPrice, maxPrice, onMinChange, onMaxChange, error }) {
  return (
    <div className="field-group price-range">
      <label>Price Range</label>
      <div className="price-inputs">
        <input
          type="number"
          placeholder="Min price"
          value={minPrice}
          min="0"
          step="0.01"
          onChange={(e) => onMinChange(e.target.value)}
        />
        <span className="price-separator">—</span>
        <input
          type="number"
          placeholder="Max price"
          value={maxPrice}
          min="0"
          step="0.01"
          onChange={(e) => onMaxChange(e.target.value)}
        />
      </div>
      {error && <p className="price-error">{error}</p>}
    </div>
  );
}
