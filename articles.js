const oracledb = require('oracledb');
const axios = require('axios');

const apiKey = '73462ea41b1a456ebc12d8045eeedf4b';
const url = `https://newsapi.org/v2/everything?q=tech&from=2023-05-26&apiKey=${apiKey}`;

const fetchData = async () => {
  const pool = await oracledb.createPool({
    user: 'system',
    password: 'ayesha123',
    connectString: 'localhost/XE',
    poolAlias: 'myPool' // Specify a pool alias for easy reference
  });

  const response = await axios.get(url);
  const data = response.data;

  const contentIds = [];
  const articlesData = [];

  for (const article of data.articles) {
    let contentId;
    let duplicateId = true;

    while (duplicateId) {
      contentId = Math.floor(Math.random() * 1000000);
      duplicateId = contentIds.includes(contentId);
    }

    contentIds.push(contentId);

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

  // Save the content data
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

  // Save the articles data
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


  await connection.close();
  await pool.close();
};

fetchData().catch(err => {
  console.error(err);
  process.exit(1);
});