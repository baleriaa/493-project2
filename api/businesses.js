const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');

const businesses = require('../data/businesses');
const { reviews } = require('./reviews');
const { photos } = require('./photos');
const { ObjectID } = require('mongodb');
const { parse } = require('dotenv');

exports.router = router;
exports.businesses = businesses;

/*
 * Schema describing required/optional fields of a business object.
 */
const businessSchema = {
  ownerid: { required: true },
  name: { required: true },
  address: { required: true },
  city: { required: true },
  state: { required: true },
  zip: { required: true },
  phone: { required: true },
  category: { required: true },
  subcategory: { required: true },
  website: { required: false },
  email: { required: false }
};

async function getBusinessesPage(page) {
  const collection = db.collection('businesses');
  const count = await collection.countDocuments();
  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;
  const results = await collection.find({})
    .sort({ _id: 1 })
    .skip(offset)
    .limit(pageSize)
    .toArray();

  return {
    businesses: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    totalCount: count
  };
}

async function insertNewBusiness(business) {
  const businessValues = {
    ownerid: business.ownerid,
    name: business.name,
    address: business.address,
    city: business.city,
    state: business.state,
    zip: business.zip,
    phone: business.phone,
    category: business.category,
    subcategory: business.subcategory,
    website: business.website,
    email: business.email
  };
  const db = getDbReference();
  const collection = db.collection('businesses');
  const result = await collection.insertOne(business);

  return result.insertedId;
}

async function getBusinessById(id) {
  const collection = db.collection('businesses');

  const results = await collection.find({
    _id: new ObjectID(id)
  }).toArray();

  return results[0];
}

async function updateBusinessById(id, business) {
  const businessValues = {
      name: business.name,
      address: business.address,
      city: business.city,
      state: business.state,
      zip: business.zip,
      phone: business.phone,
      category: business.category,
      subcategory: business.subcategory,
      website: business.website,
      email: business.email
  };
  const collection = db.collection('business');

  const result = await collection.replaceOne(
      { _id: new ObjectID(id) },
      businessValues
  );

  return result.matchedCount > 0;
}

async function deleteBusinessById(id) {
  const collection = db.collection('business');

  const result = await collection.deleteOne({
    _id: new ObjectID(id)
  });

  return result.deletedCount > 0;
}

/*
 * Route to return a list of businesses.
 */
router.get('/', async (req, res) => {
  const businessesPage = 
    await getBusinessesPage(parseInt(req.query.page) || 1);
  res.status(200).send(businessesPage);
});

/*
 * Route to create a new business.
 */
router.post('/', async (req, res ) => {
  if (validateAgainstSchema(req.body, businessSchema)) {
    try {
      const id = await insertNewBusiness(req.body);
      res.status(201).json({
        id: id,
        links: {
          business: `/businesses/${id}`
        }
      });
    } catch (err) {
      console.error(" -- Error:", err);
      res.status(500).send({
        error: "Error inserting business into DB.  Please try again later."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body does not contain a valid business."
    })
  }
});

/*
 * Route to fetch info about a specific business.
 */
router.get('/:businessid', async (req, res, next) => {
  const business = await getBusinessById(req.params.businessid);
  if (business) {
    res.status(200).send(business);
  } else {
    next();
  }
});

/*
 * Route to replace data for a business.
 */
router.put('/:businessid', async (req, res, next) => {
  // const businessid = parseInt(req.params.businessid);
  // if (businesses[businessid]) {

    if (validateAgainstSchema(req.body, businessSchema)) {
      // businesses[businessid] = extractValidFields(req.body, businessSchema);
      // businesses[businessid].id = businessid;
      // res.status(200).json({
      //   links: {
      //     business: `/businesses/${businessid}`
      //   }
      // });
      const updateSuccessful = await updateBusinessById(parseInt(req.params.businessid), req.body);
      if (updateSuccessful) {
        res.status(204).send({
        });
      } else {
        next();
      }
    } else {
      res.status(400).json({
        error: "Request body is not a valid business object"
      });
    }
});

/*
 * Route to delete a business.
 */
router.delete('/:businessid', async (req, res, next) => {
  const deleteSuccessful = await
  deleteBusinessById(parseInt(req.params.businessid));

  if (deleteSuccessful) {
    res.status(204).end();
  } else {
    next();
  }
});
