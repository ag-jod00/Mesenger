const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://abhinandan02102010:GMbhDelrMBGp2Ohi@cluster0.ulvjd.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db("messengerDB"); // Change this to your desired database name
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
  }
}

module.exports = connectDB;
