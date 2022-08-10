const mongodb = require('mongodb');

if (!process.env.DBHOST) {
  throw new Error("Please specify database host using DBHOST.");
}
if (!process.env.DBNAME) {
  throw new Error("Please specify database name using DBNAME.");
}

const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;

console.log(DBNAME);
console.log(DBHOST);

// Connects to MongoDB using ENV names.
function connectDb() {
  return mongodb.MongoClient.connect(DBHOST)
    .then(client => {
      return client.db(DBNAME);
    });
}

function populate(db) {
  const videoCollection = db.collection("videos");

  return videoCollection.insertOne({
    "_id": mongodb.ObjectId("5d9e690ad76fe06a3d7ae416"),
    "videoPath": "SampleVideo_1280x720_1mb.mp4"
  })
    .then(() => console.log("success"));
}

function main() {
  return connectDb()
    .then(db => {
      return populate(db);
    })
}

main()
  .then(() => console.log("Database populated"))
  .catch(err => {
    console.error("Error populating database.");
    console.error(err && err.stack || err);
  });