/*
Explanation:
This JavaScript file represents the backend server code for handling requests related to saved items in the TechBit web application.

The code initializes an Express server and sets up necessary middleware such as body-parser and CORS. It also establishes a connection pool with the Oracle database.

The server provides two routes: POST '/saveditems' and GET '/saveditems'. 

The POST route is responsible for saving an item to the user's saved items. It expects the user ID and content ID in the request body. It inserts the provided values into the 'saveditem' table and sends a success response if the operation is successful.

The GET route is responsible for retrieving the saved items of a user. It expects the user ID as a query parameter. It fetches the relevant data from the database by joining the 'saveditem' table with the 'courses', 'articles', 'codingcomps', and 'content' tables based on the content ID. It returns the retrieved data as a response.

The server listens on port 3004 for incoming requests.

*/

const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const app = express();
app.use(express.json());
app.use(cors());

let pool;

async function initialize() {
  pool = await oracledb.createPool({
    user: 'system',
    password: 'ayesha123',
    connectString: 'localhost/XE',
    poolAlias: 'myPool'
  });
}

initialize();

app.post('/saveditems', async (req, res) => {
  console.log(req.body);
  let connection;
  try {
    const { user_id, content_id } = req.body;
    connection = await oracledb.getConnection('myPool');
    const result = await connection.execute(
      `INSERT INTO saveditem (user_id, content_id) VALUES (:user_id, :content_id)`,
      { user_id, content_id }
    );
    await connection.commit(); // Commit the changes
    res.send({ message: 'Item saved!' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Error saving item.' });
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

app.get('/saveditems', async (req, res) => {
  let connection;
  try {
    const { user_id } = req.query;
    connection = await oracledb.getConnection('myPool');
    const result = await connection.execute(
      `SELECT 
         COALESCE(c.COURSETITLE, a.TITLE, com.NAME) AS TITLE,
         COALESCE(c.PROVIDER, a.AUTHOR, com.SITE) AS AUTHOR_OR_PROVIDER,
         co.CATEGORY,
         COALESCE(c.IMAGE_URL, a.IMAGE_URL, com.IMAGE_URL) AS IMAGE_URL,
         COALESCE(c.URL, a.URL, com.URL) AS URL
       FROM saveditem si
       LEFT JOIN courses c ON si.content_id = c.CONTENT_ID 
       LEFT JOIN articles a ON si.content_id = a.CONTENT_ID
       LEFT JOIN codingcomps com ON si.content_id = com.CONTENT_ID
       INNER JOIN content co ON si.content_id = co.CONTENT_ID 
       WHERE si.user_id = :user_id`,
      { user_id }
    );
    res.send(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Error fetching saved items.' });
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

app.listen(3004, () => console.log('Server started at port 3004'));
