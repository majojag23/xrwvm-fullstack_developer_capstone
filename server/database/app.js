const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3030;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const Reviews = require('./review');
const Dealerships = require('./dealership');

const reviewsData = JSON.parse(
  fs.readFileSync('reviews.json', 'utf8')
);

const dealershipsData = JSON.parse(
  fs.readFileSync('dealerships.json', 'utf8')
);

// Home
app.get('/', (req, res) => {
  res.send('Welcome to the Mongoose API');
});

// Fetch all reviews
app.get('/fetchReviews', async (req, res) => {
  try {
    const documents = await Reviews.find();
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching reviews' });
  }
});

// Fetch reviews by dealership
app.get('/fetchReviews/dealer/:id', async (req, res) => {
  try {
    const documents = await Reviews.find({
      dealership: req.params.id
    });
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching dealer reviews' });
  }
});

// Fetch all dealerships
app.get('/fetchDealers', async (req, res) => {
  try {
    const documents = await Dealerships.find();
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching dealerships' });
  }
});

// Fetch dealerships by state
app.get('/fetchDealers/:state', async (req, res) => {
  try {
    const documents = await Dealerships.find({
      state: req.params.state
    });
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error fetching dealerships by state'
    });
  }
});

// Fetch dealership by ID
app.get('/fetchDealer/:id', async (req, res) => {
  try {
    const documents = await Dealerships.find({
      id: req.params.id
    });
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching dealer' });
  }
});

// Insert a review
// The raw parser also supports clients that send JSON as plain text.
app.post(
  '/insert_review',
  express.raw({ type: '*/*' }),
  async (req, res) => {
    let data;

    try {
      data = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString('utf8'))
        : req.body;
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid review data' });
    }

    try {
      const lastReview = await Reviews.findOne().sort({ id: -1 });
      const newId = lastReview ? Number(lastReview.id) + 1 : 1;

      const review = new Reviews({
        id: newId,
        name: data.name,
        dealership: data.dealership,
        review: data.review,
        purchase: data.purchase,
        purchase_date: data.purchase_date,
        car_make: data.car_make,
        car_model: data.car_model,
        car_year: data.car_year
      });

      const savedReview = await review.save();
      return res.json(savedReview);
    } catch (error) {
      console.error(error);

      const status = error.name === 'ValidationError' ? 400 : 500;
      return res.status(status).json({
        error: 'Error inserting review'
      });
    }
  }
);

// Connect to MongoDB, load initial data and start the server.
async function startServer() {
  try {
    await mongoose.connect('mongodb://mongo_db:27017/', {
      dbName: 'dealershipsDB'
    });

    if (await Reviews.countDocuments() === 0) {
      await Reviews.insertMany(reviewsData.reviews);
    }

    if (await Dealerships.countDocuments() === 0) {
      await Dealerships.insertMany(dealershipsData.dealerships);
    }

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error starting the server:', error);
    process.exit(1);
  }
}

startServer();