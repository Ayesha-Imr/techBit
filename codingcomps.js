/*
Explanation:
This JavaScript file is responsible for fetching coding competition data from an external API and saving it to the database. It uses the OracleDB module to interact with the Oracle database. The fetched data includes information such as competition name, URL, start time, end time, duration, site, in_24_hours, and status. The data is then stored in the CodingComps table in the database along with unique content IDs.
*/

const oracledb = require('oracledb');

const fetchData = async () => {
  const pool = await oracledb.createPool({
    user: 'system',
    password: 'ayesha123',
    connectString: 'localhost/XE',
    poolAlias: 'myPool' // Specify a pool alias for easy reference
  });

  const response = await fetch('https://kontests.net/api/v1/all');
  const data = await response.json();

  const contentIds = [];
  const codingCompsData = [];

  for (const contest of data) {
    const contentId = Math.floor(Math.random() * 1000000); // Generate random number between 0 and 999999
    contentIds.push(contentId);

    const start_time = new Date(contest.start_time).toISOString();
    const end_time = new Date(contest.end_time).toISOString();

    const codingCompsDataItem = {
      contentId: contentId,
      name: contest.name,
      url: contest.url,
      start_time: start_time,
      end_time: end_time,
      duration: contest.duration,
      site: contest.site,
      in_24_hours: contest.in_24_hours,
      status: contest.status
    };
    codingCompsData.push(codingCompsDataItem);
  }

  // Save the content data
  const contentData = {
    content_id: contentIds,
    category: 'Coding Competitions'
  };
  console.log('Content Data:', contentData); // Output contentData to inspect the values

  const connection = await pool.getConnection();

  // Insert content data using a PL/SQL block
  const contentStmt = `
    DECLARE
      type content_id_array_type IS TABLE OF NUMBER INDEX BY BINARY_INTEGER;
      l_content_id content_id_array_type;
    BEGIN
      l_content_id := :content_id;
      FORALL i IN 1..l_content_id.COUNT
        INSERT INTO Content (content_id, category)
        VALUES (l_content_id(i), :category);
    END;
  `;
  await connection.execute(contentStmt, contentData);

  // Save the coding comps data
  const codingCompsStmt = `
    INSERT INTO CodingComps (
      content_id,
      name,
      url,
      start_time,
      end_time,
      duration,
      site,
      in_24_hours,
      status
    )
    VALUES (
      :contentId,
      :name,
      :url,
      TO_TIMESTAMP_TZ(:start_time, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"', 'NLS_DATE_LANGUAGE=AMERICAN'),
      TO_TIMESTAMP_TZ(:end_time, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"', 'NLS_DATE_LANGUAGE=AMERICAN'),
      :duration,
      :site,
      :in_24_hours,
      :status
    )
  `;

  for (const item of codingCompsData) {
    console.log('Coding Comps Data:', item); // Output the item object to inspect the values
    await connection.execute(codingCompsStmt, item);
    await connection.commit();
  }

  await connection.close();
  await pool.close();
};

fetchData().catch(err => {
  console.error(err);
  process.exit(1);
});
