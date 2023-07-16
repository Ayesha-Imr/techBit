/*
The "server.js" file is the main entry point of the TechBit application's backend. It is responsible for establishing the server, connecting to the Oracle database, and defining the API endpoints that will fetch data from the database based on user requests. These endpoints provide the necessary data to frontend pages like the course, articles, coding competition pages and also to fetch user interests. 

This server uses Express.js for setting up the server and routing, OracleDB for interacting with the Oracle database, CORS for handling cross-origin requests, and Path for file and directory paths.
*/

// Import necessary modules
const express = require('express');
const oracledb = require('oracledb');
const path = require('path');
const cors = require('cors');

// Setting up the server
const app = express();

// Configuring OracleDB output format
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// Middleware to parse JSON requests and handle static files
app.use(express.json());
app.use(express.static(path.join(__dirname, 'Users', 'Home', 'Desktop', 'Ayesha', 'techBit')));

// Enabling CORS for all requests
app.use(cors());

let pool;

// Initializing connection pool to OracleDB
async function initialize() {
  pool = await oracledb.createPool({
    user: 'system',
    password: 'ayesha123',
    connectString: 'localhost/XE',
    poolAlias: 'myPool' // Specify a pool alias for easy reference
  });
}

initialize();

// Define an API endpoint to fetch course data from the database
app.get('/courses', async (req, res) => {
  let connection;
  try {
    const ids = [59, 63, 78, 84, 93, 95, 102, 107, 112, 114, 120, 122, 127];
    connection = await oracledb.getConnection('myPool');
    const result = await connection.execute(
      `SELECT * FROM courses WHERE CONTENT_ID IN (${ids.join(',')})`
    );
    console.log(result.rows);
    res.send(result.rows);
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Define an API endpoint to fetch articles data from the database
app.get('/articles', async (req, res) => {
  let connection;
  try {
    const ids = [19205, 567841, 47883, 611556, 391459, 512497, 424919, 843137, 886160, 218870, 451846];
    connection = await oracledb.getConnection('myPool');
    const result = await connection.execute(
      `SELECT * FROM articles WHERE CONTENT_ID IN (${ids.join(',')})`
    );
    console.log(result.rows);
    res.send(result.rows);
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Define an API endpoint to fetch coding competitions data from the database
app.get('/codingcomps', async (req, res) => {
  let connection;
  try {
    const ids = [901907, 681392, 374633, 57338, 647069, 735819, 685978, 484317, 180725, 697070, 972085];
    connection = await oracledb.getConnection('myPool');
    const result = await connection.execute(
      `SELECT * FROM codingcomps WHERE CONTENT_ID IN (${ids.join(',')})`
    );
    console.log(result.rows);
    res.send(result.rows);
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Define an API endpoint to fetch user's interests from the database
app.get('/interests/:user_id', async (req, res) => {
  let connection;
  try {
    const { user_id } = req.params;
    connection = await oracledb.getConnection('myPool');
    const result = await connection.execute(
      `SELECT d.NAME 
       FROM INTERESTS i 
       INNER JOIN DOMAIN d ON i.DOMAIN_ID = d.DOMAIN_ID 
       WHERE i.USER_ID = :user_id`,
      { user_id }
    );
    console.log(result.rows);
    res.send(result.rows.map(row => row.NAME));
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Starting the server
app.listen(3001, () => console.log('Server started at port 3001'));
