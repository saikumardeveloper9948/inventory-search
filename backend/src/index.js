const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/search', require('./routes/search'));
app.use('/supplier', require('./routes/supplier'));
app.use('/inventory', require('./routes/inventory'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
