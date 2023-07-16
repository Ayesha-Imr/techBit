/*
Explanation:
This JavaScript module (fetchCodingComps.mjs) is responsible for fetching coding competitions data from an external API and inserting it into an Oracle database using the oracledb module.

The code first imports the necessary modules: fetch from node-fetch and oracledb.

It then creates a connection pool using the oracledb.createPool() function, specifying the necessary connection details.

After creating the connection pool, the code uses the fetch() function to retrieve coding competition data from the 'https://kontests.net/api/v1/all' API.

The fetched data is filtered to include only competitions with end_time after the current time.

Next, the code acquires a connection from the connection pool using oracledb.getConnection().

For each competition in the filtered data, the code maps the necessary field values and builds an INSERT query.

The code then uses the acquired connection to execute the INSERT query for each competition, using conn.execute().

Once all the INSERT queries have been executed, the code calculates the total number of inserted rows and logs it to the console.

Finally, the connection is released back to the pool using conn.close().

*/

import fetch from 'node-fetch';
import oracledb from 'oracledb';

oracledb.createPool({
  user: 'system',
  password: 'ayesha123',
  connectString: 'localhost/XE',
  poolAlias: 'myPool'
})
  .then(() => {
    fetch('https://kontests.net/api/v1/all')
      .then(response => response.json())
      .then(data => {
        let contests = data;

        contests = contests.filter(contest => {
          let endTime = new Date(contest.end_time);
          let currentTime = new Date();
          return endTime > currentTime;
        });

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

              params['id'] = index + 1;

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
