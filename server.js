
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer Config (Storage in memory for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage });

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

const fineSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  userName: String,
  bookId: { type: String, required: true },
  bookTitle: String,
  amount: { type: Number, required: true },
  reason: String,
  status: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
  timestamp: { type: Number, default: Date.now }
});

const Book = mongoose.model('Book', bookSchema);
const User = mongoose.model('User', userSchema);
const BorrowRequest = mongoose.model('BorrowRequest', requestSchema);
const History = mongoose.model('History', historySchema);
const Fine = mongoose.model('Fine', fineSchema);

// --- Admin Config ---
const ADMIN_EMAILS = ['admin@484', 'admin@albayan.edu'];

// --- API Routes ---

// Image Upload to Cloudinary
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Convert buffer to base64
    const fileStr = req.file.buffer.toString('base64');
    const fileType = req.file.mimetype;

    const uploadResponse = await cloudinary.uploader.upload(`data:${fileType};base64,${fileStr}`, {
      folder: 'albayan_library',
    });

    res.json({ url: uploadResponse.secure_url });
  } catch (err) {
    console.error('Cloudinary Upload Error:', err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

app.get('/api/books', async (req, res) => {
  try { const books = await Book.find(); res.json(books); } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/books', async (req, res) => {
  try {
    const book = await Book.findOneAndUpdate({ id: req.body.id }, req.body, { upsert: true, new: true });
    res.status(201).json(book);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.post('/api/books/bulk', async (req, res) => {
  try {
    const books = req.body;
    const operations = books.map(book => {
      const { _id, __v, ...updateData } = book;
      return {
        updateOne: {
          filter: { id: book.id },
          update: { $set: updateData },
          upsert: true
        }
      };
    });
    await Book.bulkWrite(operations);
    res.status(201).json({ success: true, count: books.length });
  } catch (err) {
    console.error('Bulk Books Error:', err);
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try { await Book.findOneAndDelete({ id: req.params.id }); res.json({ message: 'Book deleted' }); } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/users', async (req, res) => {
  try { const users = await User.find(); res.json(users); } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const { id, name, avatarUrl, class: userClass, role: requestedRole } = req.body;
    let finalRole = requestedRole || 'STUDENT';
    if (ADMIN_EMAILS.includes(id)) finalRole = 'ADMIN';
    const user = await User.findOneAndUpdate({ id: id }, { name, avatarUrl, class: userClass, role: finalRole }, { upsert: true, new: true });
    res.status(201).json(user);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.post('/api/users/bulk', async (req, res) => {
  try {
    const users = req.body;
    const operations = users.map(user => {
      const { _id, __v, ...updateData } = user;
      let finalRole = user.role || 'STUDENT';
      if (ADMIN_EMAILS.includes(user.id)) finalRole = 'ADMIN';
      return {
        updateOne: {
          filter: { id: user.id },
          update: { $set: { ...updateData, role: finalRole } },
          upsert: true
        }
      };
    });
    await User.bulkWrite(operations);
    res.status(201).json({ success: true, count: users.length });
  } catch (err) {
    console.error('Bulk Users Error:', err);
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try { await User.findOneAndDelete({ id: req.params.id }); res.json({ message: 'User deleted' }); } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/requests', async (req, res) => {
  try { const requests = await BorrowRequest.find().sort({ timestamp: -1 }); res.json(requests); } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/requests', async (req, res) => {
  try { const request = new BorrowRequest(req.body); const newRequest = await request.save(); res.status(201).json(newRequest); } catch (err) { res.status(400).json({ message: err.message }); }
});

app.patch('/api/requests/:id', async (req, res) => {
  try { const request = await BorrowRequest.findOneAndUpdate({ id: req.params.id }, { status: req.body.status }, { new: true }); res.json(request); } catch (err) { res.status(400).json({ message: err.message }); }
});

app.get('/api/history', async (req, res) => {
  try { const history = await History.find().sort({ borrowDate: -1 }); res.json(history); } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/history', async (req, res) => {
  try { const record = new History(req.body); await record.save(); res.status(201).json(record); } catch (err) { res.status(400).json({ message: err.message }); }
});

app.patch('/api/history/:id', async (req, res) => {
  try { const record = await History.findOneAndUpdate({ id: req.params.id }, { returnDate: req.body.returnDate }, { new: true }); res.json(record); } catch (err) { res.status(400).json({ message: err.message }); }
});

app.get('/api/fines', async (req, res) => {
  try { const fines = await Fine.find().sort({ timestamp: -1 }); res.json(fines); } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/fines', async (req, res) => {
  try { const fine = new Fine(req.body); await fine.save(); res.status(201).json(fine); } catch (err) { res.status(400).json({ message: err.message }); }
});

app.patch('/api/fines/:id', async (req, res) => {
  try { const fine = await Fine.findOneAndUpdate({ id: req.params.id }, { status: req.body.status }, { new: true }); res.json(fine); } catch (err) { res.status(400).json({ message: err.message }); }
});

// --- Static Frontend Serving ---
// This serves the built React files from the 'dist' folder
app.use(express.static(path.join(__dirname, 'dist')));

// The "catch-all" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
