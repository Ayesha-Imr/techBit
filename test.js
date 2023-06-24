const oracledb = require('oracledb');

async function run() {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: 'system',
      password: 'ayesha123',
      connectString: 'localhost/XE',
      // Add the following line to use Thick mode
      // This may help bypass the NJS-138 error
      externalAuth: false
    });

    console.log('Successfully connected to Oracle!');
  } catch(err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch(err) {
        console.error(err);
      }
    }
  }
}

run();
