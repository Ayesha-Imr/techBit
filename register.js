/*
The "register.js" file is the backend server for handling user registration, login, profile editing, and user data retrieval in the TechBit application. It also manages user interests and social media links. It uses Express.js for routing, OracleDB for database interactions, and CORS for handling cross-origin requests. Multer is used for handling multipart/form-data, which is primarily used for uploading files.

This file establishes server, connects to the Oracle database, sets up middleware, and defines multiple API endpoints for various operations. Some of the operations include new user registration, user login, saving user interests, editing user's profile picture, retrieving user data, managing user's social media links, and closing the pool connections when the server is terminated. 

It provides APIs for frontend pages like the registration page, login page, user profile page, and so on.
*/

// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const oracledb = require('oracledb');
const multer = require('multer');
const path = require('path');
const app = express();
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));


app.use(cors()); // Enable All CORS Requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
let pool;

// Initialize the OracleDB connection pool
async function initialize() {
  pool = await oracledb.createPool({
    user: 'system',
    password: 'ayesha123',
    connectString: 'localhost/XE',
    poolAlias: 'myPool' // Specify a pool alias for easy reference
  });
}

// Function to close the pool and terminate the process
async function closePoolAndExit() {
  console.log("\nTerminating");
  try {
    await oracledb.getPool('myPool').close(0);
    console.log("Pool closed");
    process.exit(0);
  } catch(err) {
    console.error(err.message);
    process.exit(1);
  }
}

// Handlers to call closePoolAndExit() on termination signals
process
  .once('SIGTERM', closePoolAndExit)
  .once('SIGINT',  closePoolAndExit);

// Define an API endpoint to register a new user
app.post('/register', async function(req, res) {
  let connection;

  try {
    const { name, email, username, password, gender, country } = req.body;
    console.log(req.body);

    // Server-side validation
    if (!name || !email || !username || !password || !gender || !country) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    console.log('Connecting to the database...');
    connection = await oracledb.getConnection('myPool');
    console.log('Connected to the database.');

    let user_id;
    let isUnique = false;

    // Generate unique user_id
    while (!isUnique) {
      user_id = (Math.random().toString(36).substr(2, 2) + Math.random().toString(36).substr(2, 3)).toUpperCase();

      const { resultSet } = await connection.execute(
        `SELECT USER_ID FROM TB_USER WHERE USER_ID = :user_id`,
        { user_id },
        { resultSet: true }
      );

      const rows = await resultSet.getRows(1);

      if (rows.length === 0) {
        isUnique = true;
      }

      if (resultSet) {
        await resultSet.close();
      }
    }

    // Check if username already exists
    const usernameQuery = `SELECT * FROM TB_USER WHERE USERNAME = :username`;
    const usernameResult = await connection.execute(usernameQuery, { username });
    const existingUsername = usernameResult.rows[0];

    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists.' });
    }

    // Check if email already exists
    const emailQuery = `SELECT * FROM TB_USER WHERE EMAIL = :email`;
    const emailResult = await connection.execute(emailQuery, { email });
    const existingEmail = emailResult.rows[0];

    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    // Insert the user into the database
    console.log('Executing SQL statement: INSERT INTO TB_USER...');
    await connection.execute(
      `INSERT INTO TB_USER (USER_ID, NAME, USERNAME, EMAIL, PASSWORD, GENDER, COUNTRY, PROFILEPIC_URL) VALUES (:user_id, :name, :username, :email, :password, :gender, :country, :profilepic_url)`,
      { user_id, name, username, email, password, gender, country, profilepic_url: 'http://localhost:3000/images/default-profile-picture.jpg' }
    );      

    // Commit the changes
    await connection.commit();
    console.log('SQL statement executed successfully.');

    res.status(200).json({ message: 'Registration successful!', user_id: user_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred during registration.' });
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

// Define an API endpoint to save user's interests
app.post('/save-interests', async function(req, res) {
  let connection;

  try {
    const { interests } = req.body;
    const { user_id } = req.body; 

    if (!interests || !user_id) {
      return res.status(400).json({ error: 'Invalid request.' });
    }

    connection = await oracledb.getConnection('myPool');

    // Get the domain_id for each interest
    const domainIds = [];
    for (const interest of interests) {
        const query = `SELECT DOMAIN_ID FROM DOMAIN WHERE UPPER(NAME) = UPPER(:interest)`;
        const result = await connection.execute(query, { interest: interest.toUpperCase() });
        const domain = result.rows[0];
        if (!domain || !domain[0]) {
            return res.status(400).json({ error: `No corresponding domain found for interest ${interest}.` });
        }
        domainIds.push(domain[0]);

    }
    // Insert the interests into the interests table
    for (const domainId of domainIds) {
      await connection.execute(
      `INSERT INTO INTERESTS (USER_ID, DOMAIN_ID) VALUES (:user_id, :domain_id)`,
      { user_id, domain_id: domainId }
      );
    }

    // Commit the changes
    await connection.commit();
    res.status(200).json({ message: 'Interests saved successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while saving interests.' });
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

// Define an API endpoint to fetch user data
app.get('/user/:user_id', async function(req, res) {
  let connection;

  try {
    const { user_id } = req.params;

    console.log('Connecting to the database...');
    connection = await oracledb.getConnection('myPool');
    console.log('Connected to the database.');

    // Retrieve user information
    const userQuery = `
    SELECT NAME, USERNAME, EMAIL, PROFILEPIC_URL
    FROM TB_USER
    WHERE USER_ID = :user_id
  `;
  const userResult = await connection.execute(userQuery, { user_id });
  const user = userResult.rows[0];

    // Retrieve user interests
    const interestsQuery = `
      SELECT D.NAME
      FROM TB_USER U
      JOIN INTERESTS I ON U.USER_ID = I.USER_ID
      JOIN DOMAIN D ON I.DOMAIN_ID = D.DOMAIN_ID
      WHERE U.USER_ID = :user_id
    `;
    const interestsResult = await connection.execute(interestsQuery, { user_id });
    const interests = interestsResult.rows.map(row => row[0]);

    const userData = {
      name: user[0],
      username: user[1],
      email: user[2],
      profilepic_url: user[3],
      interests
    };

    res.status(200).json(userData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while retrieving user data.' });
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
  
// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});

const upload = multer({ storage: storage });
  
// Define an API endpoint to edit user's profile picture  
app.post('/user/:user_id/edit-profile-picture', upload.single('profile-picture'), async function(req, res) {
  let connection;

  try {
    const { user_id } = req.params;
    const profilepic_url = 'http://localhost:3000/images/' + req.file.filename;

    connection = await oracledb.getConnection('myPool');

    // Update the user's profile picture in the database
    await connection.execute(
      `UPDATE TB_USER SET PROFILEPIC_URL = :profilepic_url WHERE USER_ID = :user_id`,
      { profilepic_url, user_id }
    );

    // Commit the changes
    await connection.commit();

    res.status(200).json({ profilepic_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while updating the profile picture.' });
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

// Define an API endpoint to handle user login
app.post('/login', async function(req, res) {
  let connection;

  try {
    const { username_email, password } = req.body;

    if (!username_email || !password) {
      return res.status(400).json({ error: 'Username/email and password are required.' });
    }

    console.log('Connecting to the database...');
    connection = await oracledb.getConnection('myPool');
    console.log('Connected to the database.');

    const query = `SELECT * FROM TB_USER WHERE (USERNAME = :username_email OR EMAIL = :username_email) AND PASSWORD = :password`;
    const result = await connection.execute(query, { username_email, password });

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    // Here you might want to generate a session or a token, which will be used for user authentication in subsequent requests
    // ...
    // For the purpose of this example, we'll return the user id

    res.status(200).json({ user_id: user[0] }); // Assuming that user[0] is the user id
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred during login.' });
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

// Define an API endpoint to save user's social media links
app.post('/user/:user_id/socials', async function(req, res) {
  let connection;

  try {
    const { user_id } = req.params;
    const { github, linkedin, twitter, facebook, instagram } = req.body;

    connection = await oracledb.getConnection('myPool');

    // Delete existing social media links
    await connection.execute(
      `DELETE FROM SOCIAL_MEDIA_LINKS WHERE USER_ID = :user_id`,
      { user_id }
    );

    // Add new social media links
    const socials = { github, linkedin, twitter, facebook, instagram };
    for (const [name, url] of Object.entries(socials)) {
      if (url) {
        const link_id = (Math.random().toString(36).substr(2, 2) + Math.random().toString(36).substr(2, 2)).toUpperCase();
        await connection.execute(
          `INSERT INTO SOCIAL_MEDIA_LINKS (LINK_ID, USER_ID, SOCIAL_MEDIA_NAME, LINK_URL) VALUES (:link_id, :user_id, :name, :url)`,
          { link_id, user_id, name, url }
        );
      }
    }

    // Commit the changes
    await connection.commit();

    res.status(200).json({ message: 'Social media links saved successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while saving social media links.' });
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

// Define an API endpoint to fetch user's social media links
app.get('/user/:user_id/socials', async function(req, res) {
  let connection;

  try {
    const { user_id } = req.params;

    connection = await oracledb.getConnection('myPool');

    // Retrieve user social media links
    const query = `
      SELECT SOCIAL_MEDIA_NAME, LINK_URL
      FROM SOCIAL_MEDIA_LINKS
      WHERE USER_ID = :user_id
    `;
    const result = await connection.execute(query, { user_id });

    const socials = {};
    for (const row of result.rows) {
      socials[row[0].toLowerCase()] = row[1];
    }

    res.status(200).json(socials);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while retrieving social media links.' });
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
  
// Initialize the server and start listening for requests
initialize().then(() => {
  app.listen(3000, () => {
    console.log('Server started and listening on port 3000');
  });
});