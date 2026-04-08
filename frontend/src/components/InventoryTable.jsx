export default function InventoryTable({ results, loading }) {
  if (loading) {
    return <p className="status-msg">Loading...</p>;
  }

  if (results.length === 0) {
    return <p className="status-msg no-results">No results found</p>;
  }

  return (
    <div className="table-wrapper">
      <p className="result-count">{results.length} item{results.length !== 1 ? 's' : ''} found</p>
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Supplier</th>
            <th>City</th>
          </tr>
        </thead>
        <tbody>
          {results.map((item) => (
            <tr key={item.id}>
              <td>{item.product_name}</td>
              <td><span className={`badge badge-${item.category.toLowerCase()}`}>{item.category}</span></td>
              <td>${item.price.toFixed(2)}</td>
              <td>{item.quantity}</td>
              <td>{item.supplier_name}</td>
              <td>{item.supplier_city}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
