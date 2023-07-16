// Explanation: This JavaScript file fetches articles data from an external API, processes the data, and saves it to an Oracle database. It uses the oracledb and axios libraries for database connection and API requests respectively. The fetched articles are assigned unique content IDs and inserted into the Content and Articles tables of the database.

const oracledb = require('oracledb');
const axios = require('axios');

const apiKey = '73462ea41b1a456ebc12d8045eeedf4b';
const url = `https://newsapi.org/v2/everything?q=tech&from=2023-05-26&apiKey=${apiKey}`;

const fetchData = async () => {
  // Create a database connection pool
  const pool = await oracledb.createPool({
    user: 'system',
    password: 'ayesha123',
    connectString: 'localhost/XE',
    poolAlias: 'myPool' // Specify a pool alias for easy reference
  });

  // Fetch articles data from the external API
  const response = await axios.get(url);
  const data = response.data;

  const contentIds = [];
  const articlesData = [];

  // Process each article and assign a unique content ID
  for (const article of data.articles) {
    let contentId;
    let duplicateId = true;

    // Generate a unique content ID
    while (duplicateId) {
      contentId = Math.floor(Math.random() * 1000000);
      duplicateId = contentIds.includes(contentId);
    }

    contentIds.push(contentId);

    // Create an object with the processed article data
    const articlesDataItem = {
      contentId: contentId,
      title: article.title,
      description: article.description,
      url: article.url,
      publishedAt: new Date(article.publishedAt).toISOString(),
      author: article.author
    };
    articlesData.push(articlesDataItem);
  }

  // Save the content data to the Content table
  const contentData = {
    content_id: contentIds,
    category: 'Articles'
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

  // Save the articles data to the Articles table
  const articlesStmt = `
    INSERT INTO Articles (
      content_id,
      title,
      description,
      url,
      dateposted,
      author
    )
    VALUES (
      :contentId,
      :title,
      :description,
      :url,
      TO_TIMESTAMP_TZ(:publishedAt, 'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"', 'NLS_DATE_LANGUAGE=AMERICAN'),
      COALESCE(:author, 'N/A') -- Use COALESCE to replace null author with 'N/A'
    )
  `;

  // Process and insert each article into the database
  for (const item of articlesData) {
    console.log('Articles Data:', item); // Output the item object to inspect the values

    // Check for null values and replace them with appropriate defaults
    const processedItem = {
      contentId: item.contentId,
      title: item.title,
      description: item.description,
      url: item.url,
      publishedAt: item.publishedAt || new Date().toISOString(), // Use current timestamp if publishedAt is null
      author: item.author || 'N/A' // Replace null author with 'N/A'
    };

    await connection.execute(articlesStmt, processedItem);
    await connection.commit();
  }

  // Close the database connection
  await connection.close();
  await pool.close();
};

fetchData().catch(err => {
  console.error(err);
  process.exit(1);
});
