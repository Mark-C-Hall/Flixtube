const express = require("express");
const aws = require("@aws-sdk/client-s3");

const app = express();

const port = process.env.PORT;
const bucket = process.env.BUCKET_NAME;

app.get("/video", (req, res) => {
  const key = `videos/${req.query.path}`;
  const params = {
    Bucket: bucket,
    Key: key,
    ObjectAttributes: ["ObjectSize"],
  };
  const getAttributeCommand = new aws.GetObjectAttributesCommand(params);
  const getObjectCommand = new aws.GetObjectCommand({
    Bucket: params.Bucket,
    Key: params.Key,
  });


  const client = new aws.S3Client();

  client
    .send(getAttributeCommand)
    .then((attributeData) => {
      client
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

app.listen(port, () => {
  console.log(`Microservice online at port ${port}`);
});
