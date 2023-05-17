const express = require("express");
const cors = require("cors");
require("dotenv").config();

const port = process.env.PORT || 5000;
const app = express();

// midlewire
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kgqetuh.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const jobCollection = client.db("jobPortalDB").collection("jobs");

    // Creating index on two fields
    const indexKeys = { title: 1, category: 1 };
    const indexOptions = { name: "titleCategory" };
    const result = await jobCollection.createIndex(indexKeys, indexOptions);
    console.log(result);

    app.get("/allJobs/:status", async (req, res) => {
      const status = req.params.status;

      if (status == "Onsite" || status == "Remote") {
        const query = { status: status };
        const result = await jobCollection.find(query).toArray();
        return res.send(result);
      }

      const result = await jobCollection.find().toArray();
      res.send(result);
    });

    app.get("/job_details/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const result = await jobCollection.findOne(query);
      res.send(result);
    });

    app.post("/postJob", async (req, res) => {
      const jobDetails = req.body;
      console.log(jobDetails);

      const result = await jobCollection.insertOne(jobDetails);
      res.send(result);
    });

    // get jobs by search
    app.get("/getJobsBySearch/:text", async (req, res) => {
      const text = req.params.text;
      console.log("hit the api")
      const result = await jobCollection
        .find({
          $or: [
            { title: { $regex: text, $options: "i" } },
            { category: { $regex: text, $options: "i" } },
          ],
        })
        .toArray();
      res.send(result);
    });


    // pagination
    app.get('/totalJobs', async(req, res)=>{
      const result = await jobCollection.estimatedDocumentCount();
      res.send({totalJobs : result})
    });

    // pagination data send 
    app.get("/jobs", async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit =  4;
      const skip = (page - 1) * limit;

      const result = await jobCollection.find().skip(skip).limit(limit).toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to Job Portal Server");
});

app.listen(port, () => {
  console.log(`job portal server is running on port: ${port}`);
});
