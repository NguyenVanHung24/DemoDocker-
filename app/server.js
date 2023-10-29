let express = require('express');
let path = require('path');
let fs = require('fs');
try {var MongoClient = require('mongodb').MongoClient;
}
catch (error) {console.log(error)}
let bodyParser = require('body-parser');
let app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
// custom middleware to enable CORS
const cors = function(request, response, next) {
      response.header("Access-Control-Allow-Origin", "*"); // CORS HEADER
      response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"); // CORS HEADER
  next();
};
app.use(cors);
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
  });

app.get('/profile-picture', function (req, res) {
  let img = fs.readFileSync(path.join(__dirname, "images/profile-1.jpg"));
  res.writeHead(200, {'Content-Type': 'image/jpg' });
  res.end(img, 'binary');
});

// use when starting application locally with node command
let mongoUrlLocal = "mongodb://admin:password@localhost:27017";

// use when starting application as a separate docker container
let mongoUrlDocker = "mongodb://admin:password@host.docker.internal:27017";

// use when starting application as docker container, part of docker-compose
let mongoUrlDockerCompose = "mongodb://admin:password@mongodb";

// pass these options to mongo client connect request to avoid DeprecationWarning for current Server Discovery and Monitoring engine
let mongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS:1000};

// "user-account" in demo with docker. "my-db" in demo with docker-compose
let databaseName = "my-db";

app.post('/update-profile', function (req, res) {
  let userObj = req.body;

  MongoClient.connect(mongoUrlLocal, mongoClientOptions, function (err, client) {
    if (err) {
      console.error('MongoDB connection error:', err);
      return res.status(500).send('Failed to connect to MongoDB server');
    }

    let db = client.db(databaseName);
    userObj['userid'] = 1;

    let myquery = { userid: 1 };
    let newvalues = { $set: userObj };

    db.collection("users").updateOne(myquery, newvalues, { upsert: true }, function(err, result) {
      if (err) {
        console.error('MongoDB update error:', err);
        client.close();
        return res.status(500).send('Failed to update user profile');
      }

      client.close();
      
      // Send a success response
      res.send(userObj);
    });
  });
});

app.get('/get-profile', function (req, res) {
  let response = {};

  MongoClient.connect(mongoUrlLocal, mongoClientOptions, function (err, client) {
    if (err) {
      console.error('MongoDB connection error:', err);
      res.send({});
      return;
    }

    let db = client.db(databaseName);
    let myquery = { userid: 1 };

    db.collection("users").findOne(myquery, function (err, result) {
      client.close();

      if (err) {
        console.error('MongoDB query error:', err);
        res.send({});
        return;
      }

      // Send response
      res.send(result || {});
    });
  });
});


app.listen(3000, function () {
  console.log("app listening on port 3000!");
});
