const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');
const  { ObjectID } = require('mongodb');
const photos = require('../data/photos');
const { get } = require('mongoose');

exports.router = router;
exports.photos = photos;

/*
 * Schema describing required/optional fields of a photo object.
 */
const photoSchema = {
  userid: { required: true },
  businessid: { required: true },
  caption: { required: false }
};

async function insertNewPhoto(photo) {
  const photoValues = {
    userid: photo.userid,
    businessid: photo.businessid,
    caption: photo.caption
  };
  const db = getDbReference();
  const collection = db.collection('photos');
  const result = await collection.insertOne(photo);

  return result.insertedId;
}

async function getPhotoById(id) {
  const collection = db.collection('photos');

  const results = await collection.find({
    _id: new ObjectID(id)
  }).toArray();

  return results[0];
}

async function updatePhotoById(id, photo) {
  const photoValues = {
    userid: photo.userid,
    businessid: photo.businessid,
    caption: photo.caption
  };
  const collection = db.collection('photo');

  const result = await collection.replaceOne(
      { _id: new ObjectID(id) },
      photoValues
  );

  return result.matchedCount > 0;
}

async function deletePhotoById(id) {
  const collection = db.collection('photos');
  
  const result = await collection.deleteOne({
    _id: new ObjectID(id)
  });

  return result.deletedCount > 0;
}

/*
 * Route to create a new photo.
 */
router.post('/', async (req, res, next) => {
  if (validateAgainstSchema(req.body, photoSchema)) {
    const id = await insertNewPhoto(req.body);
    res.status(201).json({
      id: id,
      links: {
        photo: `/photos/${id}`,
        business: `/businesses/${req.body.businessid}`
      }
    });

  } else {
    res.status(400).json({
      error: "Request body is not a valid photo"
    });
  }
});

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:photoID', async (req, res, next) => {
  const photo = await getPhotoById(parseInt(req.params.photoID));

  if (photo) {
    res.status(200).json(photo);
  } else {
    next();
  }
});

/*
 * Route to update a photo.
 */
router.put('/:photoID', async (req, res, next) => {
  if (validateAgainstSchema(req.body, photoSchema)) {
    const updateSuccessful = await updatePhotoById(parseInt(req.params.photoID), req.body);

    if (updateSuccessful) {
      res.status(204).send();
    } else {
      next();
    }

    } else {
      res.status(400).json({
        error: "Photo update not valid"
      });
    }
});

/*
 * Route to delete a photo.
 */
router.delete('/:photoID', async function (req, res, next) {
  const deleteSuccessful = await
  deletePhotoById(parseInt(req.params.photoID));

  if (deleteSuccessful) {
    res.status(204).end();
  } else {
    next();
  }
});
