const CATEGORIES = ['All', 'Electronics', 'Industrial', 'Office', 'Hardware', 'Clothing'];

export default function CategoryDropdown({ value, onChange }) {
  return (
    <div className="field-group">
      <label htmlFor="category">Category</label>
      <select id="category" value={value} onChange={(e) => onChange(e.target.value)}>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  );
}
