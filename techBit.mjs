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
    fetch('https://kontests.net/api/v1/all')
      .then(response => response.json())
      .then(data => {
        let contests = data;

        // Filter contests with end_time after current time
        contests = contests.filter(contest => {
          let endTime = new Date(contest.end_time);
          let currentTime = new Date();
          return endTime > currentTime;
        });

        // Acquire a connection from the pool
        oracledb.getConnection('myPool')
          .then(conn => {
            let insertPromises = contests.map((contest, index) => {
              let fieldNames = [
                'id',
                'name',
                'url',
                'start_time',
                'end_time',
                'duration',
                'site',
                'in_24_hours',
                'status'
              ];

              let params = {};

              fieldNames.forEach(fieldName => {
                let value = contest[fieldName] || '';

                // Convert date strings to JavaScript Date object
                if (['start_time', 'end_time'].includes(fieldName)) {
                  value = value ? new Date(value) : '';
                }

                params[fieldName] = value;
              });

              let query = `
                INSERT INTO Content (${fieldNames.join(', ')})
                VALUES (
                  :${fieldNames.join(', :')}
                )
              `;

              params['id'] = index + 1; // Assigning id starting from 1

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
