const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');

const reviews = require('../data/reviews');
const { photos } = require('./photos');
const { ObjectID } = require('mongodb');

exports.router = router;
exports.reviews = reviews;

/*
 * Schema describing required/optional fields of a review object.
 */
const reviewSchema = {
  userid: { required: true },
  businessid: { required: true },
  dollars: { required: true },
  stars: { required: true },
  review: { required: false }
};


async function insertNewReview(review) {
  const reviewValues = {
    userid: review.userid,
    businessid: review.businessid,
    dollars: review.dollars,
    stars: review.stars,
    review: review.review
  };
  const db = getDbReference();
  const collection = db.collection('reviews');
  const result = await collection.insertOne(reviewValues);

  return result.insertedId;  
}

async function getReviewById(id) {
  const db = getDbReference();
  const collection = db.collection('reviews');

  const results = await collection.find({
    _id: new ObjectID(id)
  }).toArray();

  return results[0];
}

async function updateReviewById(id, review) {
  const reviewValues = {
    userid: review.userid,
    businessid: review.businessid,
    dollars: review.dollars,
    stars: review.stars,
    review: review.review
  };
  const collection = db.collection('reviews');

  const result = await collection.replaceOne(
      { _id: new ObjectID(id) },
      reviewValues
  );

  return result.matchedCount > 0;
}

async function deleteReviewById(id) {
  const collection = db.collection('review');

  const result = await collection.deleteOne({
    _id: new ObjectID(id)
  });

  return result.deletedCount > 0;
}

/*
 * Route to create a new review.
 */
router.post('/', async (req, res, next) => {
  if (validateAgainstSchema(req.body, reviewSchema)) {

    const id = await insertNewReview(review);
    res.status(201).json({
      id: id
    });

  } else {
    res.status(400).json({
      error: "Request body does not contain a valid review."
    });
  }
});

/*
 * Route to fetch info about a specific review.
 */
router.get('/:reviewID', async (req, res, next) => {
  const review = await getLodgingById(parseInt(req.params.reviewID));

  if (review) {
    res.status(200).json(review);
  } else {
    next();
  }
});

/*
 * Route to update a review.
 */
router.put('/:reviewID', async (req, res, next) => {
  if (validateAgainstSchema(req.body, reviewSchema)) {
    const updateSuccessful = await updateReviewById(parseInt(req.params.reviewID), req.body);

    if (updateSuccessful) {
      res.status(204).send();
    } else {
      next();
    }
        
  } else {
      res.status(403).json({
        error: "Review update not valid"
      });
    }
});

/*
 * Route to delete a review.
 */
router.delete('/:reviewID', async function (req, res, next) {
  const deleteSuccessful = await
  deleteReviewById(parseInt(req.params.reviewID));

  if (deleteSuccessful) {
    res.status(204).end();
  } else {
    next();
  }
});
