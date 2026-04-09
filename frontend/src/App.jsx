import { Layout, Input, Select, InputNumber, Button, Table, Empty, Spin, Alert } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useState, useEffect } from 'react';
import './App.css';

const { Header, Content, Footer } = Layout;

export default function App() {
  const [searchParams, setSearchParams] = useState({
    q: '',
    category: '',
    minPrice: null,
    maxPrice: null,
  });

  const [results, setResults] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Use environment variable for deployed URL, fallback to localhost for development
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
    // Perform initial search to show all results
    performSearch({});
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/categories`);
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const performSearch = async (params) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const queryParams = new URLSearchParams();
      if (params.q) queryParams.append('q', params.q);
      if (params.category) queryParams.append('category', params.category);
      if (params.minPrice !== null && params.minPrice !== undefined) {
        queryParams.append('minPrice', params.minPrice);
      }
      if (params.maxPrice !== null && params.maxPrice !== undefined) {
        queryParams.append('maxPrice', params.maxPrice);
      }

      const response = await axios.get(
        `${API_BASE}/search?${queryParams.toString()}`
      );

      if (response.data.success) {
        setResults(response.data.data);
      } else {
        setError(response.data.error || 'Failed to fetch results');
        setResults([]);
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to connect to server. Is it running on port 5000?');
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch(searchParams);
  };

  const handleClear = () => {
    setSearchParams({
      q: '',
      category: '',
      minPrice: null,
      maxPrice: null,
    });
    setHasSearched(false);
    setError(null);
    performSearch({});
  };

  const handleInputChange = (field, value) => {
    setSearchParams((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const columns = [
    {
      title: 'Product Name',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#001529',
          color: 'white',
          paddingLeft: '50px',
          fontSize: '24px',
          fontWeight: 'bold',
        }}
      >
        📦 Inventory Search
      </Header>

      <Content style={{ padding: '50px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Search Panel */}
          <div
            style={{
              background: '#fafafa',
              padding: '30px',
              borderRadius: '8px',
              marginBottom: '30px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <h2>Search Inventory</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              {/* Product Name Search */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Product Name
                </label>
                <Input
                  placeholder="Search by product name..."
                  value={searchParams.q}
                  onChange={(e) => handleInputChange('q', e.target.value)}
                  onPressEnter={handleSearch}
                />
              </div>

              {/* Category Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Category
                </label>
                <Select
                  placeholder="All categories"
                  value={searchParams.category || undefined}
                  onChange={(value) => handleInputChange('category', value || '')}
                  allowClear
                  options={categories.map((cat) => ({
                    label: cat,
                    value: cat,
                  }))}
                />
              </div>

              {/* Min Price */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Min Price ($)
                </label>
                <InputNumber
                  min={0}
                  step={10}
                  placeholder="0"
                  value={searchParams.minPrice}
                  onChange={(value) => handleInputChange('minPrice', value)}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Max Price */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Max Price ($)
                </label>
                <InputNumber
                  min={0}
                  step={10}
                  placeholder="999999"
                  value={searchParams.maxPrice}
                  onChange={(value) => handleInputChange('maxPrice', value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={loading}
              >
                Search
              </Button>
              <Button
                size="large"
                icon={<ClearOutlined />}
                onClick={handleClear}
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              closable
              style={{ marginBottom: '20px' }}
              onClose={() => setError(null)}
            />
          )}

          {/* Results Section */}
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <h2>Results</h2>
            <Spin spinning={loading}>
              {results.length === 0 && hasSearched ? (
                <Empty description="No results found" />
              ) : (
                <Table
                  dataSource={results}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  locale={{ emptyText: 'No data' }}
                />
              )}
            </Spin>
          </div>

          {/* Summary */}
          {hasSearched && !loading && (
            <div style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>
              Found <strong>{results.length}</strong> result{results.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#001529', color: 'white' }}>
        Inventory Search © 2026 | Built with React + Ant Design
      </Footer>
    </Layout>
  );
}
