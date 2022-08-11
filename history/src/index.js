const express = require('express');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const amqp = require('amqplib');

// Throw errors if ENV variables are not set.
if (!process.env.DBHOST) {
  throw new Error('Please specify the database host using DBHOST.');
}

if (!process.env.DBNAME) {
  throw new Error('Please specify the database name using DBNAME.');
}

if (!process.env.RABBIT) {
  throw new Error('Please specify the RabbitMQ host using RABBIT.');
}

// Set ENV Variables.
const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;
const RABBIT = process.env.RABBIT;

// Connects to MongoDB using ENV names.
function connectDb() {
  return mongodb.MongoClient.connect(DBHOST)
      .then((client) => {
        return client.db(DBNAME);
      });
}

// Connects to RabbitMQ using ENV variable.
function connectRabbit() {
  console.log(`Connecting to RabbitMQ at ${RABBIT}.`);

  // Connect to the RabbitMQ server.
  return amqp.connect(RABBIT)
      .then((messagingConnection) => {
      // Create a RabbitMQ messaging channel.
        return messagingConnection.createChannel();
      });
}

// Set up event handlers.
function setupHandlers(app, db, messageChannel) {
  const videoCollection = db.collection('videos');

  // Handler for coming messages.
  function consumeViewedMessage(msg) {
    // Parse the JSON message.
    const parsedMsg = JSON.parse(msg.content.toString());

    // Record the view in the DB.
    return videoCollection.insertOne({videoPath: parsedMsg.videoPath})
        .then(() => messageChannel.ack(msg)); // If no error, ack message.
  };

  // Assert that we have a viewed queue.
  return messageChannel.assertExchange('viewed', 'fanout')
      .then(() => {
      // Start receiving messages from the 'viewed' queue.
        return messageChannel.assertQueue('', {exclusive: true});
      })
      .then((response) => {
        const queueName = response.queue;
        return messageChannel.bindQueue(queueName, 'viewed', '')
            .then(() => {
              messageChannel.consume(queueName, consumeViewedMessage);
            });
      });
}


// With the DB and RabbitMQ connection, launches an express HTTP Server.
function startHttpServer(db, messageChannel) {
  // Wrap in promise so we can be notified that the server has started.
  return new Promise((resolve) => {
    const app = express();
    // Enable JSON body for HTTP requests.
    app.use(bodyParser.json());
    setupHandlers(app, db, messageChannel);

    const port = process.env.PORT && parseInt(process.env.PORT) || 3000;
    app.listen(port, () => {
      // HTTP is listening, resolve.
      resolve();
    });
  });
}

// Connect to DB and RabbitMQ, then start Web Server.
function main() {
  return connectDb()
      .then((db) => {
        return connectRabbit()
            .then((messageChannel) => {
              return startHttpServer(db, messageChannel);
            });
      });
}

// Execute.
main()
    .then(() => console.log('History Microservice Online.'))
    .catch((err) => {
      console.error('History Microservice failed to start.');
      console.error(err && err.stack || err);
    });
