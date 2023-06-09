import fetch from 'node-fetch';
import oracledb from 'oracledb';

// Create a connection pool
oracledb.createPool({
  user: 'system',
  password: 'ayesha123',
  connectString: 'localhost/XE',
  poolAlias: 'myPool' // Specify a pool alias for easy reference
})
.then(() => {
  // Fetch contest data
fetch('https://codeforces.com/api/contest.list')
.then(response => response.json())
.then(data => {
  let contests = data.result;

  // Filter contests for year 2023 or above and compDate after today's date
  contests = contests.filter(contest => {
    let compDate = new Date(contest.startTimeSeconds * 1000);
    let today = new Date();
    today.setHours(0, 0, 0, 0); // Set hours to 0 for accurate date comparison
    return compDate.getFullYear() >= 2023 && compDate > today;
  });

  // Acquire a connection from the pool
  oracledb.getConnection('myPool')
    .then(conn => {
      let insertPromises = contests.map(contest => {
        let fieldNames = [
          'contentID',
          'title',
          'description',
          'datePosted',
          'source_url',
          'domain',
          'regDeadline',
          'compDate',
          'prize'
        ];

        let params = {};

        fieldNames.forEach(fieldName => {
          let value = contest[fieldName] || '';

          // Convert UNIX timestamp to JavaScript Date object
          if (['compDate', 'regDeadline'].includes(fieldName)) {
            value = value ? new Date(value * 1000) : '';
          }

          params[fieldName] = value;
        });

        let query = `
          INSERT INTO Content (${fieldNames.join(', ')})
          VALUES (
            :${fieldNames.join(', :')}
          )
        `;

        return conn.execute(query, params, { autoCommit: true });
      });

      return Promise.all(insertPromises)
        .then(results => {
          let totalRowsAffected = results.reduce((sum, result) => sum + result.rowsAffected, 0);
          console.log(totalRowsAffected + ' row(s) inserted.');
        })
        .catch(err => {
          console.error(err);
        })
        .finally(() => {
          // Release the connection back to the pool
          conn.close();
        });
    })
    .catch(err => {
      console.error(err);
    });
})
.catch(err => {
  console.error(err);
});

})
.catch(err => {
  console.error(err);
});
