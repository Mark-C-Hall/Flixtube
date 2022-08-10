const express = require('express');
const http = require('http');
const mongodb = require('mongodb');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const amqp = require('amqplib');

// If ENV variable is not set, throw error.
if (!process.env.PORT) {
  throw new Error("Please specify port number using PORT.");
}
if (!process.env.VIDEO_STORAGE_HOST) {
  throw new Error("Please specify video storage host using VIDEO_STORAGE_HOST.");
}
if (!process.env.VIDEO_STORAGE_PORT) {
  throw new Error("Please specify video storage port using VIDEO_STORAGE_PORT.");
}
if (!process.env.DBHOST) {
  throw new Error("Please specify database host using DBHOST.");
}
if (!process.env.DBNAME) {
  throw new Error("Please specify database name using DBNAME.");
}
if (!process.env.RABBIT) {
  throw new Error("Please specify the RabbitMQ host using RABBIT.");
}

// Declare ENV variables.
const PORT = process.env.PORT;
const videoStorageHost = process.env.VIDEO_STORAGE_HOST;
const videoStoragePort = parseInt(process.env.VIDEO_STORAGE_PORT);
const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;
const RABBIT = process.env.RABBIT;

// Connects to MongoDB using ENV names.
function connectDb() {
  return mongodb.MongoClient.connect(DBHOST)
    .then(client => {
      return client.db(DBNAME);
    });
}

// Connects to RabbitMQ using ENV variable.
function connectRabbit() {
  console.log(`Connecting to RabbitMQ at ${RABBIT}`);

  // Connect to the RabbitMQ server.
  return amqp.connect(RABBIT)
    .then(messagingConnection => {
      // Create a RabbitMQ messaging channel.
      return messagingConnection.createChannel()
        .then(messageChannel => {
          return messageChannel.assertExchange("viewed", "fanout")
            .then(() => messageChannel);
        });
    });
}

// Send the 'viewed' to the history microservice.
function sendViewedMessage(messageChannel, videoPath) {
  const msg = { videoPath: videoPath };
  const jsonMsg = JSON.stringify(msg);

  // Publish message to the view exchange.
  messageChannel.publish("viewed", "", Buffer.from(jsonMsg));
}

// Set up event handlers.
function setupHandlers(app, db, messageChannel) {
  const videoCollection = db.collection('videos');

  // Handle GET request to /video
  app.get("/video", (req, res) => {
    // Get video ID by request query path.
    const videoId = new mongodb.ObjectId(req.query.id);
    videoCollection.findOne({ _id: videoId })
      .then(videoRecord => {
        if (!videoRecord) {
          res.sendStatus(404);
          return;
        }

        // Build HTTP Request
        const forwardRequest = http.request({
          host: videoStorageHost,
          port: videoStoragePort,
          path: `/video?path=${videoRecord.videoPath}`,
          method: 'GET',
          headers: req.headers
        },
          // Build HTTP response.
          forwardResponse => {
            res.writeHeader(
              forwardResponse.statusCode,
              forwardResponse.headers
            );
            forwardResponse.pipe(res);
          }
        );
        // Forward response to Browser.
        req.pipe(forwardRequest);


        // Send message to history microservice that this video has been viewed.
        sendViewedMessage(messageChannel, videoRecord.videoPath);
      })
      .catch(err => {
        console.error('Database query failed.');
        console.error(err && err.stack || err);
        res.sendStatus(500);
      });
  });
}

function startHttpServer(db, messageChannel) {
  // Wrap in promise so we can be notified that the server has started.
  return new Promise(resolve => {
    const app = express();
    // Enable JSON body for HTTP requests.
    app.use(bodyParser.json());
    app.use(morgan('dev'));
    setupHandlers(app, db, messageChannel);

    const port = process.env.PORT && parseInt(process.env.PORT) || 3000;
    app.listen(port, () => {
      // HTTP is listening, resolve.
      resolve();
    });
  });
}

// Connect to DB then connect to RabbitMQ then start HTTP server.
function main() {
  return connectDb()
    .then(db => {
      return connectRabbit()
        .then(messageChannel => {
          return startHttpServer(db, messageChannel);
        });
    });
}

// Execute
main()
  .then(() => console.log("Video Streaming Microservice Online."))
  .catch(err => {
    console.error('Video-streaming failed to start');
    console.error(err && err.stack || err);
  });


