const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

app.use(cors());
app.use(express.json());

// VERIFY JWT TOKEN
const verifyJWT = (req, res, next) => {
  const authHead = req.headers.authorization;
  if (!authHead) {
    return res.status(401).send({ message: "Unauthorized Access." });
  }
  const token = authHead.split(" ")[1];
  jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
};

// VERIFY EMAIL WITH JWT
const verifyEmail = (req, res, next) => {
  const userEmail = req.query.email;
  const decodedEmail = req.decoded.email;
  console.log("uEmail", userEmail);
  if (userEmail !== decodedEmail) {
    return res.status(403).send({ message: "Forbidden Access." });
  }
  next();
};

// MONGODB STARTS
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wobl1ex.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    // USERS
    const usersCollection = client.db("laptopHunter").collection("users");
    // CATEGORIES OR BRAND
    const categoriesCollection = client
      .db("laptopHunter")
      .collection("categories");
    // PRODUCTS
    const productsCollection = client.db("laptopHunter").collection("products");
    // BOOKINGS OR ORDERS
    const bookingsCollection = client.db("laptopHunter").collection("bookings");
    // SAVE USER
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // CREATE OR SIGN JWT TOKEN
    app.post("/jwt", (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.SECRET_ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      console.log(token);
      res.send({ token });
    });

    // GET USERS
    app.get("/users", async (req, res) => {
      const userType = req.query.userType;
      const query = { userType: userType };
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });

    // GET USER BY EMAIL
    app.get("/user", async (req, res) => {
      const email = req.query.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send(user);
    });

    // VERIFIED SELLERS
    app.put("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          verified: true,
        },
      };
      const result = await usersCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    // DELETE SELLERS
    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // BRANDS
    app.get("/brands", async (req, res) => {
      const query = {};
      const brands = await categoriesCollection.find(query).toArray();
      res.send(brands);
    });

    // BRAND
    app.get("/brand/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const brand = await categoriesCollection.findOne(query);
      res.send(brand);
    });

    // ADD PRODUCT
    app.post("/addproducts", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    // ALL PRODUCTS
    app.get("/products", async (req, res) => {
      const query = {};
      const products = await productsCollection.find(query).toArray();
      res.send(products);
    });

    // QUERY WITH BRAND
    app.get("/product", async (req, res) => {
      const brand = req.query.brand;
      const query = { brand: brand };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    // QUERY WITH EMAIL
    app.get("/myproduct", async (req, res) => {
      const email = req.query.email;
      const query = { sellerEmail: email };
      const products = await productsCollection.find(query).toArray();
      res.send(products);
    });

    // UPDATE MY PRODUCT STATUS SOLD
    app.put("/productsold/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: "sold",
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // UPDATE MY PRODUCT STATUS AVAILABLE
    app.put("/productavailable/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: "available",
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // DELETE MY PRODUCTS
    app.delete("/myproduct/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    // PRODUCT BOOKING
    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    // GET BOOKING BY EMAIL
    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
      const query = { buyerEmail: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    // mongodb ends
  } catch (error) {
    console.log(error);
  }
}

run().catch(console.dir);

// TEST SERVER API
app.get("/", (req, res) => {
  res.send("Laptop Hunter server is running...");
});

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
