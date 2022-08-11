const express = require("express");
const aws = require("@aws-sdk/client-s3");

// If ENV variable is not set, throw error.
if (!process.env.PORT) {
  throw new Error("Please specify port number using PORT.");
}
if (!process.env.BUCKET_NAME) {
  throw new Error("Please specify the bucket name using BUCKET_NAME.");
}

// Declare ENV variables
const PORT = process.env.PORT;
const BUCKET = process.env.BUCKET_NAME;

// Set up event handlers.
function setupHandlers(app) {
  // Hanlde GET Request
  app.get("/video", (req, res) => {
    const key = `videos/${req.query.path}`;
    const params = {
      Bucket: BUCKET,
      Key: key,
      ObjectAttributes: ["ObjectSize"],
    };
    // Create an attribute command.
    const getAttributeCommand = new aws.GetObjectAttributesCommand(params);

    // Create an object command.
    const getObjectCommand = new aws.GetObjectCommand({
      Bucket: params.Bucket,
      Key: params.Key,
    });


    // Establish the AWS client.
    const client = new aws.S3Client();

    client
      // First get the object's attributes
      .send(getAttributeCommand)
      .then((attributeData) => {
        client
          // Then get the object.
          .send(getObjectCommand)
          .then((objectData) => {
            res.writeHead(200, {
              "Content-Length": attributeData.ObjectSize,
              "Content-Type": "video/mp4",
            });
            objectData.Body.pipe(res);
          })
          .catch((err) => {
            res.sendStatus(500);
            console.log(`Error: ${err}`);
          })
      })
      .catch((err) => {
        res.sendStatus(500);
        console.log(`Error: ${err}`);
      });
  });
}

function startHttpServer() {
  // Wrap in promise so we can be notified that the server has started.
  return new Promise(resolve => {
    const app = express();
    setupHandlers(app);
    app.listen(PORT, () => {
      // HTTP is listening, resolve.
      resolve();
    });
  });
}

function main() {
  return startHttpServer();
}

// Execute
main()
  .then(() => console.log("Video-Storage Microservice Online."))
  .catch(err => {
    console.error('Video-Storage failed to start.');
    console.error(err && err.stack || err);
  });