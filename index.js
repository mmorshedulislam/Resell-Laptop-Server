const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();

app.use(cors());
app.use(express.json());

// MONGODB STARTS
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wobl1ex.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const usersCollection = client.db("laptopHunter").collection("users");

    // SAVE USER
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // GET USERS
    app.get("/users", async (req, res) => {
      const query = {};
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
