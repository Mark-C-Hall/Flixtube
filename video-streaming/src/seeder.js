const mongodb = require('mongodb');

const DBHOST = 'mongodb://localhost:4000';
const DBNAME = 'video-streaming';

// Connects to MongoDB using ENV names.
function connectDb() {
  return mongodb.MongoClient.connect(DBHOST)
      .then((client) => {
        return client.db(DBNAME);
      });
}

function populate(db) {
  const videoCollection = db.collection('videos');

  return videoCollection.insertOne({
    // eslint-disable-next-line new-cap
    '_id': mongodb.ObjectId('5d9e690ad76fe06a3d7ae416'),
    'videoPath': 'SampleVideo_1280x720_1mb.mp4',
  })
      .then(() => console.log('success'));
}

function main() {
  return connectDb()
      .then((db) => {
        return populate(db);
      });
}

main()
    .then(() => console.log('Database populated'))
    .catch((err) => {
      console.error('Error populating database.');
      console.error(err && err.stack || err);
    });
