const express = require('express');
const mongodb = require('mongodb');
const amqp = require('amqplib');
const bodyParser = require('body-parser');

if (!process.env.DBHOST) {
  throw new Error(
      'Please specify the databse host using environment variable DBHOST.',
  );
}

if (!process.env.DBNAME) {
  throw new Error(
      'Please specify the name of the database using DBNAME',
  );
}

if (!process.env.RABBIT) {
  throw new Error(
      'Please specify the name of the RabbitMQ host using RABBIT',
  );
}

const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;
const RABBIT = process.env.RABBIT;

//
// Connect to the database.
//
function connectDb() {
  return mongodb.MongoClient.connect(DBHOST)
      .then((client) => {
        return client.db(DBNAME);
      });
}

//
// Connect to the RabbitMQ server.
//
function connectRabbit() {
  console.log(`Connecting to RabbitMQ server at ${RABBIT}.`);

  return amqp.connect(RABBIT) // Connect to the RabbitMQ server.
      .then((messagingConnection) => {
        console.log('Connected to RabbitMQ.');

        // Create a RabbitMQ messaging channel.
        return messagingConnection.createChannel();
      });
}

//
// Setup event handlers.
//
function setupHandlers(app, db, messageChannel) {
  // ... YOU CAN PUT HTTP ROUTES AND OTHER MESSAGE HANDLERS HERE ...

  function consumeViewedMessage(msg) { // Handler for coming messages.
    // Parse the JSON message.
    const parsedMsg = JSON.parse(msg.content.toString());
    console.log('Received a \'viewed\' message:');
    // JUST PRINTING THE RECEIVED MESSAGE.
    console.log(JSON.stringify(parsedMsg, null, 4));

    // ... ADD YOUR CODE HERE TO PROCESS THE MESSAGE ...

    console.log('Acknowledging message was handled.');

    messageChannel.ack(msg); // If there is no error, acknowledge the message.
  };

  // Assert that we have a "viewed" exchange.
  return messageChannel.assertExchange('viewed', 'fanout')
      .then(() => {
        // Create an anonyous queue.
        return messageChannel.assertQueue('', {exclusive: true});
      })
      .then((response) => {
        const queueName = response.queue;
        console.log(`Created queue ${queueName}, binding it to viewed exchge.`);
        // Bind the queue to the exchange.
        return messageChannel.bindQueue(queueName, 'viewed', '')
            .then(() => {
              return messageChannel.consume(queueName, consumeViewedMessage);
              // Start receiving messages from the anonymous queue.
            });
      });
}

//
// Start the HTTP server.
//
function startHttpServer(db, messageChannel) {
  // Wrap in a promise so we can be notified when the server has started.
  return new Promise((resolve) => {
    const app = express();
    app.use(bodyParser.json()); // Enable JSON body for HTTP requests.
    setupHandlers(app, db, messageChannel);

    const port = process.env.PORT && parseInt(process.env.PORT) || 3000;
    app.listen(port, () => {
      resolve(); // HTTP server is listening, resolve the promise.
    });
  });
}

//
// Application entry point.
//
function main() {
  return connectDb() // Connect to the database...
      .then((db) => { // then...
        return connectRabbit() // connect to RabbitMQ...
            .then((messageChannel) => { // then...
              // start the HTTP server.
              return startHttpServer(db, messageChannel);
            });
      });
}

main()
    .then(() => console.log('Microservice online.'))
    .catch((err) => {
      console.error('Microservice failed to start.');
      console.error(err && err.stack || err);
    });
