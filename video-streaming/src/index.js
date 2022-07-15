const express = require('express');
const http = require('http');
const mongodb = require('mongodb');

const app = express();

const port = process.env.PORT;
const videoStorageHost = process.env.VIDEO_STORAGE_HOST;
const videoStoragePort = parseInt(process.env.VIDEO_STORAGE_PORT);
const dbHost = process.env.DBHOST;
const dbName = process.env.DBNAME;

mongodb.MongoClient.connect(dbHost)
  .then(client => {
    const db = client.db(dbName);
    const videoCollection = db.collection('videos');

    app.get("/video", (req, res) => {
      const videoId = new mongodb.ObjectId(req.query.id);
      videoCollection.findOne({ _id: videoId })
        .then(videoRecord => {
          if (!videoRecord) {
            res.sendStatus(404);
            return;
          }

          const forwardRequest = http.request({
            host: videoStorageHost,
            port: videoStoragePort,
            path: `/video?path=${videoRecord.videoPath}`,
            method: 'GET',
            headers: req.headers
          },
            forwardResponse => {
              res.writeHeader(forwardResponse.statusCode, forwardResponse.headers);
              forwardResponse.pipe(res);
            }
          );
          req.pipe(forwardRequest);
        })
        .catch(err => {
          console.error('Database query failed.');
          console.error(err && err.stack || err);
          res.sendStatus(500);
        });
    });

    app.listen(port, () => {
      console.log(`video-streaming microservice online at port ${port}`);
    });
  })
  .catch(err => {
    console.error('Video-streaming failed to start');
    console.error(err && err.stack || err);
  });


