const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

exports.runTDMUScraper = functions.https.onRequest(async (req, res) => {
  try {
    const { key } = req.body;
    if (key !== 'your-api-key') {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    console.log('Starting TDMU scraper via Render API...');
    
    // Call your Render-hosted API
    const response = await axios.get('https://tdmuscraper.onrender.com/scrape');
    
    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const scrapedData = response.data.articles;

    if (scrapedData && scrapedData.length > 0) {
      await updateFirebase(scrapedData);
    }

    return res.status(200).send({
      success: true,
      message: 'Scraper completed',
      articleCount: scrapedData ? scrapedData.length : 0
    });
  } catch (err) {
    console.error('Error running scraper:', err);
    return res.status(500).send({ error: err.message });
  }
});

async function updateFirebase(articles) {
  const newsCollection = db.collection('tdmu_news');
  const snapshot = await newsCollection.get();
  const existingUrls = new Set();

  snapshot.forEach(doc => existingUrls.add(doc.data().url));

  const batch = db.batch();
  let count = 0;

  for (const article of articles) {
    if (!existingUrls.has(article.url)) {
      const docRef = newsCollection.doc();
      batch.set(docRef, {
        ...article,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      count++;
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`Added ${count} new articles to Firestore`);
  } else {
    console.log('No new articles to add');
  }
}