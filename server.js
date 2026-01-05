
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/albayan_library';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully');
  })
  .catch(err => console.error('MongoDB Connection Error:', err));

// --- Schemas ---

const bookSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  category: String,
  year: Number,
  isbn: String,
  coverUrl: String,
  price: Number,
  totalCopies: { type: Number, default: 1 },
  availableCopies: { type: Number, default: 1 },
  currentBorrowers: [{
    userId: String,
    userName: String
  }]
});

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'STUDENT'], default: 'STUDENT' },
  class: String,
  avatarUrl: String
});

const requestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  bookId: { type: String, required: true },
  bookTitle: String,
  userId: { type: String, required: true },
  userName: String,
  status: { type: String, enum: ['PENDING', 'APPROVED', 'DENIED'], default: 'PENDING' },
  timestamp: { type: Number, default: Date.now }
});

const historySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  bookId: { type: String, required: true },
  bookTitle: String,
  userId: { type: String, required: true },
  userName: String,
  borrowDate: { type: Number, default: Date.now },
  returnDate: Number
});

const Book = mongoose.model('Book', bookSchema);
const User = mongoose.model('User', userSchema);
const BorrowRequest = mongoose.model('BorrowRequest', requestSchema);
const History = mongoose.model('History', historySchema);

// --- Admin Config ---
// Added admin@484 to the master admin list
const ADMIN_EMAILS = ['admin@484', 'yourname@gmail.com', 'admin@albayan.edu'];

// --- API Routes ---

app.get('/api/books', async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const book = await Book.findOneAndUpdate(
      { id: req.body.id },
      req.body,
      { upsert: true, new: true }
    );
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    await Book.findOneAndDelete({ id: req.params.id });
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { id, name, avatarUrl, role: requestedRole } = req.body;
    
    // Authorization logic: Check if ID is in master admin list
    let finalRole = requestedRole || 'STUDENT';
    if (ADMIN_EMAILS.includes(id)) {
      finalRole = 'ADMIN';
    }

    const user = await User.findOneAndUpdate(
      { id: id },
      { name, avatarUrl, role: finalRole },
      { upsert: true, new: true }
    );
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await User.findOneAndDelete({ id: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/requests', async (req, res) => {
  try {
    const requests = await BorrowRequest.find().sort({ timestamp: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/requests', async (req, res) => {
  try {
    const request = new BorrowRequest(req.body);
    const newRequest = await request.save();
    res.status(201).json(newRequest);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.patch('/api/requests/:id', async (req, res) => {
  try {
    const request = await BorrowRequest.findOneAndUpdate(
      { id: req.params.id },
      { status: req.body.status },
      { new: true }
    );
    res.json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const history = await History.find().sort({ borrowDate: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/history', async (req, res) => {
  try {
    const record = new History(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.patch('/api/history/:id', async (req, res) => {
  try {
    const record = await History.findOneAndUpdate(
      { id: req.params.id },
      { returnDate: req.body.returnDate },
      { new: true }
    );
    res.json(record);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
