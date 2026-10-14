const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const saPath = path.resolve(__dirname, '../firebase-service-account.json');
const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));

const app = initializeApp({
  credential: cert(sa),
  projectId: sa.project_id || 'star-e7eb0',
});

const db = getFirestore(app);

async function clearCollections() {
  console.log('Clearing all sessions, events, answers, drafts, and feedback from Firestore for a fresh slate...');
  const collections = ['sessions', 'events', 'answers', 'review_drafts', 'private_feedback'];

  for (const col of collections) {
    const snap = await db.collection(col).get();
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log(`Cleaned ${snap.docs.length} documents from ${col}`);
  }

  console.log('✨ Firestore is completely clean and fresh with 0 responses!');
}

clearCollections().catch(console.error);
