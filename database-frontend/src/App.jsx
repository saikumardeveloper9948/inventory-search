import {
  Layout,
  Tabs,
  Form,
  Input,
  Button,
  Table,
  Modal,
  InputNumber,
  Select,
  message,
  Spin,
  Card,
  Statistic,
  Row,
  Col,
  Tag,
  Space,
  Popconfirm,
  Progress,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  DollarOutlined,
  ShoppingOutlined,
  TeamOutlined,
  EditOutlined,
  DownloadOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useState, useEffect } from 'react';
import './App.css';

const { Header, Content, Footer } = Layout;

const API_BASE = 'http://localhost:5001';

export default function App() {
  // Suppliers state
  const [suppliers, setSuppliers] = useState([]);
  const [supplierForm] = Form.useForm();
  const [supplierModalVisible, setSupplierModalVisible] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  // Inventory state
  const [inventory, setInventory] = useState([]);
  const [inventoryForm] = Form.useForm();
  const [inventoryModalVisible, setInventoryModalVisible] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);

  // Grouped inventory state
  const [groupedInventory, setGroupedInventory] = useState([]);
  const [loadingGrouped, setLoadingGrouped] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Summary stats
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    totalItems: 0,
    totalValue: 0,
  });

  // Search state
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [categories, setCategories] = useState([]);

  // Load data on mount
  useEffect(() => {
    fetchSuppliers();
    fetchInventory();
    fetchGroupedInventory();
    fetchCategories();
  }, []);

  // Fetch suppliers
  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await axios.get(`${API_BASE}/suppliers`);
      if (response.data.success) {
        setSuppliers(response.data.data);
        setStats((prev) => ({
          ...prev,
          totalSuppliers: response.data.count,
        }));
      }
    } catch (error) {
      message.error('Failed to load suppliers');
    } finally {
      setLoadingSuppliers(false);
    }
  };

  // Fetch inventory
  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const response = await axios.get(`${API_BASE}/inventory`);
      if (response.data.success) {
        setInventory(response.data.data);
        setStats((prev) => ({
          ...prev,
          totalItems: response.data.count,
          totalValue: response.data.data.reduce(
            (sum, item) => sum + (item.total_value || 0),
            0
          ),
        }));
      }
    } catch (error) {
      message.error('Failed to load inventory');
    } finally {
      setLoadingInventory(false);
    }
  };

  // Fetch grouped inventory
  const fetchGroupedInventory = async () => {
    setLoadingGrouped(true);
    try {
      const response = await axios.get(`${API_BASE}/inventory-by-supplier`);
      if (response.data.success) {
        setGroupedInventory(response.data.data);
      }
    } catch (error) {
      message.error('Failed to load grouped inventory');
    } finally {
      setLoadingGrouped(false);
    }
  };

  // Create or Update supplier
  const handleSupplierSubmit = async (values) => {
    try {
      const isUpdate = !!editingSupplier;
      const method = isUpdate ? 'put' : 'post';
      const url = isUpdate
        ? `${API_BASE}/supplier/${editingSupplier.id}`
        : `${API_BASE}/supplier`;

      const response = await axios[method](url, {
        name: values.name,
        city: values.city,
      });

      if (response.data.success) {
        message.success(
          `Supplier ${isUpdate ? 'updated' : 'created'} successfully`
        );
        supplierForm.resetFields();
        setSupplierModalVisible(false);
        setEditingSupplier(null);
        fetchSuppliers();
      }
    } catch (error) {
      message.error(
        error.response?.data?.error ||
          `Failed to ${editingSupplier ? 'update' : 'create'} supplier`
      );
    }
  };

  // Edit supplier
  const handleEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    supplierForm.setFieldsValue({
      name: supplier.name,
      city: supplier.city,
    });
    setSupplierModalVisible(true);
  };

  // Delete supplier
  const handleDeleteSupplier = async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/supplier/${id}`);
      if (response.data.success) {
        message.success('Supplier deleted successfully');
        fetchSuppliers();
        fetchInventory();
      }
    } catch (error) {
      message.error(
        error.response?.data?.error || 'Failed to delete supplier'
      );
    }
  };

  // Create or Update inventory item
  const handleInventorySubmit = async (values) => {
    try {
      const isUpdate = !!editingInventory;
      const method = isUpdate ? 'put' : 'post';
      const url = isUpdate
        ? `${API_BASE}/inventory/${editingInventory.id}`
        : `${API_BASE}/inventory`;

      const response = await axios[method](url, {
        supplier_id: values.supplier_id,
        product_name: values.product_name,
        category: values.category || 'Uncategorized',
        quantity: values.quantity,
        price: values.price,
      });

      if (response.data.success) {
        message.success(
          `Inventory item ${isUpdate ? 'updated' : 'created'} successfully`
        );
        inventoryForm.resetFields();
        setInventoryModalVisible(false);
        setEditingInventory(null);
        fetchInventory();
        fetchGroupedInventory();
        fetchCategories();
      }
    } catch (error) {
      message.error(
        error.response?.data?.error ||
          `Failed to ${editingInventory ? 'update' : 'create'} inventory item`
      );
    }
  };

  // Edit inventory item
  const handleEditInventory = (item) => {
    setEditingInventory(item);
    inventoryForm.setFieldsValue({
      supplier_id: item.supplier_id,
      product_name: item.product_name,
      category: item.category || 'Uncategorized',
      quantity: item.quantity,
      price: item.price,
    });
    setInventoryModalVisible(true);
  };

  // Delete inventory item
  const handleDeleteInventory = async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/inventory/${id}`);
      if (response.data.success) {
        message.success('Inventory item deleted successfully');
        fetchInventory();
        fetchGroupedInventory();
      }
    } catch (error) {
      message.error(
        error.response?.data?.error || 'Failed to delete inventory item'
      );
    }
  };

  // Fetch categories from inventory
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/inventory`);
      if (response.data.success) {
        const uniqueCategories = [...new Set(response.data.data.map(item => item.category || 'Uncategorized'))];
        setCategories(uniqueCategories.sort());
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  // Search inventory
  const handleSearch = async () => {
    try {
      setLoadingSearch(true);
      const params = new URLSearchParams();
      
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedCategory) params.append('category', selectedCategory);
      if (minPrice > 0) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const response = await axios.get(`${API_BASE}/search?${params.toString()}`);
      
      if (response.data.success) {
        setSearchResults(response.data.data);
        if (response.data.count === 0) {
          message.info('No items found matching your criteria');
        }
      }
    } catch (error) {
      message.error(
        error.response?.data?.error || 'Failed to search inventory'
      );
    } finally {
      setLoadingSearch(false);
    }
  };

  // Suppliers table columns
  const supplierColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Supplier Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: 'Inventory Count',
      dataIndex: 'inventory_count',
      key: 'inventory_count',
      render: (count) => (
        <Tag color={count > 0 ? 'blue' : 'default'}>{count} items</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditSupplier(record)}
          />
          <Popconfirm
            title="Delete Supplier"
            description="Are you sure you want to delete this supplier?"
            onConfirm={() => handleDeleteSupplier(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Inventory table columns
  const inventoryColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Product Name',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier_name',
      key: 'supplier',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty) => <span style={{ fontWeight: 'bold' }}>{qty}</span>,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Total Value',
      dataIndex: 'total_value',
      key: 'total_value',
      render: (value) => (
        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
          ${value.toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditInventory(record)}
          />
          <Popconfirm
            title="Delete Item"
            description="Are you sure you want to delete this inventory item?"
            onConfirm={() => handleDeleteInventory(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Search results columns
  const searchResultsColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Product Name',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => <Tag>{category || 'Uncategorized'}</Tag>,
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier_name',
      key: 'supplier',
    },
    {
      title: 'City',
      dataIndex: 'supplier_city',
      key: 'city',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty) => <span style={{ fontWeight: 'bold' }}>{qty}</span>,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Total Value',
      dataIndex: 'total_value',
      key: 'total_value',
      render: (value) => (
        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
          ${value.toFixed(2)}
        </span>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'dashboard',
      label: '📊 Dashboard',
      children: (
        <div>
          <Row gutter={16} style={{ marginBottom: '30px' }}>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="Total Suppliers"
                  value={stats.totalSuppliers}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="Total Inventory Items"
                  value={stats.totalItems}
                  prefix={<ShoppingOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="Total Inventory Value"
                  value={stats.totalValue}
                  prefix={<DollarOutlined />}
                  suffix="USD"
                  valueStyle={{ color: '#faad14' }}
                  precision={2}
                />
              </Card>
            </Col>
          </Row>

          <Card title="📦 Inventory by Supplier (Grouped)" style={{ marginBottom: '30px' }}>
            <Spin spinning={loadingGrouped}>
              {groupedInventory.length === 0 ? (
                <p>No suppliers with inventory</p>
              ) : (
                <div style={{ display: 'grid', gap: '20px', overflowX: 'auto' }}>
                  {groupedInventory.map((supplierGroup) => (
                    <Card
                      key={supplierGroup.supplier.id}
                      title={`${supplierGroup.supplier.name} (${supplierGroup.supplier.city})`}
                      type="inner"
                      style={{
                        borderLeft: '4px solid #1890ff',
                      }}
                    >
                      <Row gutter={16} style={{ marginBottom: '15px', paddingRight: '0px' }} className="supplier-stats">
                        <Col xs={24} sm={8}>
                          <Statistic
                            title="Items"
                            value={supplierGroup.summary.item_count}
                            size="small"
                          />
                        </Col>
                        <Col xs={24} sm={8}>
                          <Statistic
                            title="Total Quantity"
                            value={supplierGroup.summary.total_quantity}
                            size="small"
                          />
                        </Col>
                        <Col xs={24} sm={8}>
                          <Statistic
                            title="Total Value"
                            value={`$${supplierGroup.summary.total_inventory_value.toFixed(
                              2
                            )}`}
                            size="small"
                            valueStyle={{ color: '#faad14' }}
                          />
                        </Col>
                      </Row>

                      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid #f0f0f0', borderRadius: '4px', marginTop: '12px', background: 'white', maxWidth: '100%' }} className="supplier-table-wrapper">
                        <Table
                          dataSource={supplierGroup.items}
                          columns={[
                            {
                              title: 'Product Name',
                              dataIndex: 'product_name',
                              key: 'product_name',
                              width: 180,
                            },
                            {
                              title: 'Qty',
                              dataIndex: 'quantity',
                              key: 'quantity',
                              width: 80,
                            },
                            {
                              title: 'Price',
                              dataIndex: 'price',
                              key: 'price',
                              width: 100,
                              render: (price) => `$${price.toFixed(2)}`,
                            },
                            {
                              title: 'Total',
                              dataIndex: 'total_value',
                              key: 'total_value',
                              width: 120,
                              render: (value) => `$${value.toFixed(2)}`,
                            },
                          ]}
                          rowKey="id"
                          pagination={false}
                          size="small"
                          scroll={{ x: 480 }}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Spin>
          </Card>
        </div>
      ),
    },
    {
      key: 'suppliers',
      label: '🏢 Suppliers',
      children: (
        <div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingSupplier(null);
              supplierForm.resetFields();
              setSupplierModalVisible(true);
            }}
            style={{ marginBottom: '20px' }}
          >
            Add Supplier
          </Button>

          <Spin spinning={loadingSuppliers}>
            <Table
              dataSource={suppliers}
              columns={supplierColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Spin>

          <Modal
            title={editingSupplier ? 'Edit Supplier' : 'Create New Supplier'}
            open={supplierModalVisible}
            onCancel={() => {
              setSupplierModalVisible(false);
              setEditingSupplier(null);
              supplierForm.resetFields();
            }}
            footer={null}
          >
            <Form
              form={supplierForm}
              layout="vertical"
              onFinish={handleSupplierSubmit}
            >
              <Form.Item
                label="Supplier Name"
                name="name"
                rules={[
                  { required: true, message: 'Please enter supplier name' },
                ]}
              >
                <Input placeholder="e.g., TechCorp" />
              </Form.Item>

              <Form.Item
                label="City"
                name="city"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input placeholder="e.g., San Francisco" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      ),
    },
    {
      key: 'inventory',
      label: '📦 Inventory',
      children: (
        <div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingInventory(null);
              inventoryForm.resetFields();
              setInventoryModalVisible(true);
            }}
            style={{ marginBottom: '20px' }}
          >
            Add Inventory Item
          </Button>

          <Spin spinning={loadingInventory}>
            <Table
              dataSource={inventory}
              columns={inventoryColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 800 }}
            />
          </Spin>

          <Modal
            title={editingInventory ? 'Edit Inventory Item' : 'Create New Inventory Item'}
            open={inventoryModalVisible}
            onCancel={() => {
              setInventoryModalVisible(false);
              setEditingInventory(null);
              inventoryForm.resetFields();
            }}
            footer={null}
          >
            <Form
              form={inventoryForm}
              layout="vertical"
              onFinish={handleInventorySubmit}
            >
              <Form.Item
                label="Supplier"
                name="supplier_id"
                rules={[
                  { required: true, message: 'Please select a supplier' },
                ]}
              >
                <Select placeholder="Select a supplier">
                  {suppliers.map((supplier) => (
                    <Select.Option key={supplier.id} value={supplier.id}>
                      {supplier.name} ({supplier.city})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="Product Name"
                name="product_name"
                rules={[
                  { required: true, message: 'Please enter product name' },
                ]}
              >
                <Input placeholder="e.g., Wireless Mouse" />
              </Form.Item>

              <Form.Item
                label="Category"
                name="category"
                initialValue="Uncategorized"
              >
                <Select placeholder="Select or enter a category">
                  <Select.Option value="Uncategorized">Uncategorized</Select.Option>
                  <Select.Option value="Electronics">Electronics</Select.Option>
                  <Select.Option value="Furniture">Furniture</Select.Option>
                  <Select.Option value="Cables">Cables</Select.Option>
                  <Select.Option value="Accessories">Accessories</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Quantity"
                name="quantity"
                rules={[
                  { required: true, message: 'Please enter quantity' },
                  {
                    validator: (_, value) => {
                      if (value >= 0) return Promise.resolve();
                      return Promise.reject(
                        new Error('Quantity must be >= 0')
                      );
                    },
                  },
                ]}
              >
                <InputNumber min={0} placeholder="0" />
              </Form.Item>

              <Form.Item
                label="Price ($)"
                name="price"
                rules={[
                  { required: true, message: 'Please enter price' },
                  {
                    validator: (_, value) => {
                      if (value > 0) return Promise.resolve();
                      return Promise.reject(
                        new Error('Price must be > 0')
                      );
                    },
                  },
                ]}
              >
                <InputNumber min={0.01} step={0.01} placeholder="0.00" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  {editingInventory ? 'Update Item' : 'Create Item'}
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      ),
    },
    {
      key: 'search',
      label: '🔍 Search Inventory',
      children: (
        <div>
          <Card style={{ marginBottom: '20px' }}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Input
                  placeholder="Search product name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onPressEnter={handleSearch}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Select
                  placeholder="Select category"
                  value={selectedCategory || undefined}
                  onChange={(value) => setSelectedCategory(value || '')}
                  allowClear
                  style={{ width: '100%' }}
                >
                  {categories.map((cat) => (
                    <Select.Option key={cat} value={cat}>
                      {cat}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={4}>
                <InputNumber
                  placeholder="Min Price"
                  value={minPrice}
                  onChange={(value) => setMinPrice(value || 0)}
                  min={0}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} sm={12} md={4}>
                <InputNumber
                  placeholder="Max Price"
                  value={maxPrice}
                  onChange={(value) => setMaxPrice(value)}
                  min={0}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col xs={24} md={4}>
                <Button
                  type="primary"
                  onClick={handleSearch}
                  block
                  loading={loadingSearch}
                >
                  Search
                </Button>
              </Col>
            </Row>
          </Card>

          {searchResults.length === 0 && !loadingSearch && searchQuery === '' && selectedCategory === '' && minPrice === 0 && maxPrice === null ? (
            <Empty description="Enter search criteria" />
          ) : searchResults.length === 0 && !loadingSearch ? (
            <Empty description="No results found" />
          ) : (
            <Spin spinning={loadingSearch}>
              <Table
                dataSource={searchResults}
                columns={searchResultsColumns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1000 }}
              />
            </Spin>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#001529',
          color: 'white',
          paddingLeft: '15px',
          paddingRight: '15px',
          fontSize: '18px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          minHeight: '60px',
        }}
      >
        <div style={{ fontSize: '16px', whiteSpace: 'nowrap' }}>📊 Inventory Database</div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={() => {
            fetchSuppliers();
            fetchInventory();
            fetchGroupedInventory();
          }}
          size="small"
        >
          Refresh
        </Button>
      </Header>

      <Content style={{ padding: '20px 15px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Tabs items={tabItems} defaultActiveKey="dashboard" />
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#001529', color: 'white', padding: '15px', fontSize: '12px' }}>
        Inventory Database © 2026
      </Footer>
    </Layout>
  );
}
