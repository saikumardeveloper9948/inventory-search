export default function SearchBar({ value, onChange }) {
  return (
    <div className="field-group">
      <label htmlFor="search">Product Name</label>
      <input
        id="search"
        type="text"
        placeholder="Search products..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
