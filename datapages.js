/*
Explanation:
This JavaScript file serves as the backend for the TechBit web application. It uses the Express framework to create an API server that interacts with an Oracle database using the oracledb module. The API endpoints handle requests related to articles, courses, coding competitions, and search functionality.

The file starts by importing the required modules and initializing the Oracle database connection pool. The pool is created with connection details, such as the username, password, and connect string.

The Express app is created, and middleware functions for JSON parsing and CORS are added.

The `initialize` function is defined to create the database connection pool using the oracledb module. This function is called to initialize the pool.

The API endpoints are defined using Express routing. There are endpoints for retrieving articles, courses, coding competitions, and performing a search.

The `/articles/:page` endpoint retrieves a paginated list of articles from the database based on the provided page number. The start and end rows are calculated based on the page number, and a SQL query is executed to fetch the articles.

The `/courses/:page` and `/codingcomps/:page` endpoints work similarly to retrieve paginated lists of courses and coding competitions, respectively.

The `/search` endpoint takes a query parameter and performs a case-insensitive search for articles, courses, and coding competitions that match the query. The search is done using SQL LIKE statements.

Each endpoint uses the Oracle connection pool to execute the queries, fetch the results, and send the response to the client.

The app listens on port 3003 for incoming requests.

*/

const express = require('express');
const app = express();
const oracledb = require('oracledb');
const cors = require('cors');
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
app.use(express.json());
app.use(cors());

let pool;

async function initialize() {
  pool = await oracledb.createPool({
    user: 'system',
    password: 'ayesha123',
    connectString: 'localhost/XE',
    poolAlias: 'myPool' // Specify a pool alias for easy reference
  });
}

initialize();

app.get('/articles/:page', async (req, res) => {
  let connection;
  try {
    const { page } = req.params;
    const startRow = (page - 1) * 10 + 1;
    const endRow = page * 10;

    connection = await oracledb.getConnection('myPool');
    const result = await connection.execute(
      `SELECT *
      FROM (
        SELECT a.*, ROWNUM rnum
        FROM (
          SELECT *
          FROM articles
          ORDER BY DATEPOSTED DESC
        ) a
        WHERE ROWNUM <= :endRow
      ) 
      WHERE rnum >= :startRow`, 
      { startRow, endRow }
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

app.get('/courses/:page', async (req, res) => {
  let connection;
  try {
    const { page } = req.params;
    const startRow = (page - 1) * 12 + 1;
    const endRow = page * 12;

    connection = await oracledb.getConnection('myPool');
    const result = await connection.execute(
      `SELECT *
      FROM (
        SELECT a.*, ROWNUM rnum
        FROM (
          SELECT *
          FROM courses
          ORDER BY CONTENT_ID DESC
        ) a
        WHERE ROWNUM <= :endRow
      ) 
      WHERE rnum >= :startRow`,
      { startRow, endRow }
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

app.get('/codingcomps/:page', async (req, res) => {
  let connection;
  try {
    const { page } = req.params;
    const startRow = (page - 1) * 12 + 1;
    const endRow = page * 12;

    connection = await oracledb.getConnection('myPool');
    const result = await connection.execute(
      `SELECT *
      FROM (
        SELECT a.*, ROWNUM rnum
        FROM (
          SELECT *
          FROM codingcomps
          ORDER BY START_TIME DESC
        ) a
        WHERE ROWNUM <= :endRow
      ) 
      WHERE rnum >= :startRow`,
      { startRow, endRow }
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

app.get('/search', async (req, res) => {
  let connection;
  try {
    const { query } = req.query;

    connection = await oracledb.getConnection('myPool');
    const articles = await connection.execute(
      `SELECT * FROM articles WHERE LOWER(TITLE) LIKE LOWER('%${query}%')`
    );
    const courses = await connection.execute(
      `SELECT * FROM courses WHERE LOWER(COURSETITLE) LIKE LOWER('%${query}%')`
    );
    const codingcomps = await connection.execute(
      `SELECT * FROM codingcomps WHERE LOWER(NAME) LIKE LOWER('%${query}%')`
    );
    res.send({
      articles: articles.rows,
      courses: courses.rows,
      codingcomps: codingcomps.rows,
    });
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

app.listen(3003, () => console.log('Server started at port 3003'));
