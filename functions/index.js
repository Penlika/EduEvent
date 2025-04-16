const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

// This function will return immediately and continue processing in the background
exports.runTDMUScraper = functions.https.onRequest(async (req, res) => {
  const { key } = req.body;
  if (key !== 'your-api-key') {
    console.log('Authentication failed: Invalid API key');
    return res.status(401).send({ error: 'Unauthorized' });
  }
  
  // Send a response immediately to prevent timeout
  res.status(200).send({
    success: true,
    message: 'Scraper task started in background',
  });
  
  // Continue processing in the background
  processScraping().catch(err => {
    console.error('Background processing error:', err.message);
  });
});

// Function to handle the actual scraping logic
async function processScraping() {
  try {
    console.log('Starting TDMU scraper via Render API...');
    
    let response;
    try {
      console.log('Making API request to scraper endpoint...');
      response = await axios.get('https://tdmuscraper.onrender.com/scrape', {
        headers: {
          'Accept': 'application/json',
        },
        timeout: 300000, // 5 minutes 
      });
      console.log(`API response received with status: ${response.status}`);
    } catch (apiError) {
      console.error('API request failed:', apiError.message);
      throw new Error(`Failed to fetch data from scraper: ${apiError.message}`);
    }
    
    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    if (!response.data || !response.data.articles) {
      console.error('API response missing expected data structure');
      throw new Error('Invalid response format from scraper API');
    }
    
    const scrapedData = response.data.articles;
    console.log(`Retrieved ${scrapedData.length} articles from scraper`);
    
    if (scrapedData && scrapedData.length > 0) {
      console.log('Processing articles for Firestore update...');
      const newArticleCount = await updateFirebase(scrapedData);
      console.log(`Firestore update complete. Added ${newArticleCount} new articles.`);
    } else {
      console.log('No articles received from scraper');
    }
    
    console.log('Background processing completed successfully');
  } catch (err) {
    console.error('Error in background processing:', err.message);
    if (err.stack) {
      console.error('Stack trace:', err.stack);
    }
  }
}

async function updateFirebase(articles) {
  try {
    console.log('Starting Firestore update process...');
    const newsCollection = db.collection('tdmu_news');
    
    console.log('Fetching existing articles from Firestore...');
    const snapshot = await newsCollection.get();
    const existingUrls = new Set();
    
    snapshot.forEach(doc => existingUrls.add(doc.data().url));
    console.log(`Found ${existingUrls.size} existing articles in Firestore`);
    
    const batch = db.batch();
    let count = 0;
    
    console.log('Checking for new articles to add...');
    for (const article of articles) {
      if (!article.url) {
        console.error('Found article without URL, skipping');
        continue;
      }
      
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
      console.log(`Committing batch with ${count} new articles...`);
      await batch.commit();
      console.log(`Added ${count} new articles to Firestore`);
    } else {
      console.log('No new articles to add');
    }
    
    return count;
  } catch (firestoreError) {
    console.error('Error updating Firestore:', firestoreError.message);
    if (firestoreError.stack) {
      console.error('Stack trace:', firestoreError.stack);
    }
    throw new Error(`Firestore update failed: ${firestoreError.message}`);
  }
}