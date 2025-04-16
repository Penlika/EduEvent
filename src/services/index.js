const functions = require('firebase-functions');
const { spawn } = require('child_process');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

admin.initializeApp();

const db = admin.firestore();

exports.runTDMUScraper = functions.https.onRequest(async (req, res) => {
  try {
    const { key } = req.body;
    if (key !== 'your-api-key') {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    console.log('Starting TDMU scraper...');
    const scrapedData = await runPythonScraper();

    if (scrapedData && scrapedData.length > 0) {
      await updateFirebase(scrapedData);
    }

    return res.status(200).send({
      success: true,
      message: 'Scraper completed',
      articles: scrapedData,
    });
  } catch (err) {
    console.error('Error running scraper:', err);
    return res.status(500).send({ error: err.message });
  }
});

function runPythonScraper() {
  return new Promise((resolve, reject) => {
    const outputPath = '/tmp/tdmu_articles.json';
    const pythonProcess = spawn('python3', [
      path.join(__dirname, 'tdmu_scraper.py'),
      '--output', outputPath
    ]);

    let errorOutput = '';
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) return reject(new Error(errorOutput));

      if (fs.existsSync(outputPath)) {
        const data = fs.readFileSync(outputPath, 'utf-8');
        resolve(JSON.parse(data));
      } else {
        reject(new Error('Output file not found'));
      }
    });
  });
}

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

  if (count > 0) await batch.commit();
}
