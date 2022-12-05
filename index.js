require("dotenv").config();
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(`${process.env.STRIPE_SK}`);
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
  if (userEmail !== decodedEmail) {
    return res.status(403).send({ message: "Forbidden Access." });
  }
  next();
};

// MONGODB STARTS
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wobl1ex.mongodb.net/?retryWrites=true&w=majority`;

// const client = new MongoClient(uri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   serverApi: ServerApiVersion.v1,
// });

const client = new MongoClient(
  uri,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  },
  { connectTimeoutMS: 30000 },
  { keepAlive: 1 }
);

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

    // BOOKINGS OR ORDERS
    const wishListCollection = client.db("laptopHunter").collection("wishlist");

    // ADS PRODUCTS
    const adsProductsCollection = client
      .db("laptopHunter")
      .collection("adsProducts");

    // ADS PRODUCTS
    const adsProductsCollection2 = client
      .db("laptopHunter")
      .collection("adsProducts2");

    // WISHLIST PRODUCTS
    const wishlistCollection = client.db("laptopHunter").collection("wishlist");

    // BLOGS
    const blogsCollection = client.db("laptopHunter").collection("blogs");

    // CREATE OR SIGN JWT TOKEN
    app.post("/jwt", (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.SECRET_ACCESS_TOKEN, {
        expiresIn: "1d",
      });
      res.send({ token });
    });

    // SAVE USER
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // SAVE GOOGLE USER
    app.put("/googleuser/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;

      const filter = { email };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          name: user.name,
          email: user.email,
          image: user.image,
          userType: user.userType,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // GET USERS
    app.get("/users", verifyJWT, verifyEmail, async (req, res) => {
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
    app.put("/verifyuser/:id", verifyJWT, verifyEmail, async (req, res) => {
      const id = req.params.id;
      const email = req.query.email;
      const query = { email };
      const user = await usersCollection.findOne(query);

      if (user?.role === "admin") {
        const query = { _id: ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            verified: true,
          },
        };
        const result = await usersCollection.updateOne(
          query,
          updateDoc,
          options
        );
        res.send(result);
      }
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

    // GET BOOKING or ORDERS BY EMAIL
    app.get("/bookings", verifyJWT, verifyEmail, async (req, res) => {
      const email = req.query.email;
      const query = { buyerEmail: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    //  BOOKING BY id
    app.get("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const booking = await bookingsCollection.findOne(query);
      res.send(booking);
    });

    // DELETE ORDERS
    app.delete("/myorders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await bookingsCollection.deleteOne(query);
      res.send(result);
    });

    // ADD TO WISHLIST
    app.post("/wishlist", async (req, res) => {
      const product = req.body;
      const result = await wishListCollection.insertOne(product);
      res.send(result);
    });

    // GET WISHLIST
    app.get("/wishlist/", async (req, res) => {
      const email = req.query.email;
      const query = { buyerEmail: email };
      const wishlist = await wishListCollection.find(query).toArray();
      res.send(wishlist);
    });

    // DELETE WISHLIST
    app.delete("/mywishlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await wishListCollection.deleteOne(query);
      res.send(result);
    });

    // MY BUYERS
    app.get("/mybuyers/:email", async (req, res) => {
      const email = req.params.email;
      const query = { sellerEmail: email };
      const mybuyers = await bookingsCollection.find(query).toArray();
      res.send(mybuyers);
    });

    // isAdmin
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      res.send({ isAdmin });
    });

    // isBuyer
    app.get("/users/buyer/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      const isBuyer = user?.userType === "buyer";
      res.send({ isBuyer });
    });

    // isSeller
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      const isSeller = user?.userType === "seller";
      res.send({ isSeller });
    });

    // SAVE ADS PRODUCT
    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ads: true,
        },
      };

      const updateProduct = await productsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(updateProduct);
    });

    // V2 adsproduct
    app.post("/v2/adsproduct", async (req, res) => {
      const product = req.body;
      const result = await adsProductsCollection2.insertOne(product);
      res.send(result);
    });

    // GET ADS PRODUCT
    app.get("/adsproduct", async (req, res) => {
      const adsproducts = await adsProductsCollection.find({}).toArray();
      res.send(adsproducts);
    });

    // GET ADS PRODUCT
    app.get("/adsproduct3", async (req, res) => {
      const adsproducts = await adsProductsCollection
        .find({})
        .limit(3)
        .toArray();
      res.send(adsproducts);
    });

    // ALL BLOGS
    app.get("/blogs", async (req, res) => {
      const query = {};
      const blogs = await blogsCollection.find(query).toArray();
      res.send(blogs);
    });

    // 3 BLOGS
    app.get("/blogs3", async (req, res) => {
      const query = {};
      const blogs = await blogsCollection.find(query).limit(3).toArray();
      res.send(blogs);
    });

    // STRIPE PK
    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send(paymentIntent);
    });

    // SAVE PAYMENT INFO
    app.post("/paymentinfo", async (req, res) => {
      const paymentInfo = req.body;
      const id = paymentInfo.bookingId;
      const query = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          paid: true,
          transactionId: paymentInfo.transactionId
        },
      };
      const updateBookingInfo = await bookingsCollection.updateOne(query, updateDoc, options)
      res.send(updateBookingInfo)
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
