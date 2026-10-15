const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const saPath = path.resolve(__dirname, '../firebase-service-account.json');
const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));

const app = initializeApp({
  credential: cert(sa),
  projectId: sa.project_id || 'star-e7eb0',
});

const db = getFirestore(app);

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'residence-inn-salt-2026').digest('hex');
}

async function seed() {
  console.log('Seeding fresh Firestore database for Motu Seth Restaurant...');

  const now = new Date().toISOString();

  // 1. Business Profile
  const businessId = 'motu-seth';
  const bizData = {
    id: businessId,
    name: 'Motu Seth Restaurant',
    unit: 'A Unit Of Muskan Brothers Hospitality',
    category: 'restaurant',
    location: '4th Floor, Ishwar Arcade, Service Rd, Bailey Rd, near Raj Palace, S. K. Puram, Danapur, Patna, Bihar 801503, India',
    place_id: 'ChIJA-ShB09W7TkRdmS5DCofbiw',
    phone: '7631996611',
    secondary_phone: '7631996611',
    gst_number: '10ABCFM1572E1ZW',
    fssai_number: '10421000000533',
    timezone: 'Asia/Kolkata',
    primary_color: '#d97706',
    welcome_message: {
      en: 'Welcome to Motu Seth Restaurant! Share your honest dining experience with us in 30 seconds. For helpline & orders call 7631996611.',
    },
    google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJA-ShB09W7TkRdmS5DCofbiw',
    owner_id: 'owner-motu-seth',
    owner_email: 'admin@motuseth.com',
    default_language: 'en',
    created_at: now,
    updated_at: now,
  };

  await db.collection('businesses').doc(businessId).set(bizData);
  // Also mirror to 'residence-inn' for seamless backward compatibility with any hardcoded references
  await db.collection('businesses').doc('residence-inn').set({
    ...bizData,
    id: 'residence-inn',
  });
  console.log('✅ Created business doc: motu-seth (restaurant) and synced residence-inn');

  // 2. Campaigns
  const campaigns = [
    {
      id: 'motu-seth',
      business_id: businessId,
      name: 'Main Dining Table QR',
      slug: 'motu-seth',
      active: true,
      created_at: now,
    },
    {
      id: 'table-qr',
      business_id: businessId,
      name: 'Family Lounge Table Stand',
      slug: 'table-qr',
      active: true,
      created_at: now,
    },
    {
      id: 'counter-qr',
      business_id: businessId,
      name: 'Billing Counter & Takeaway QR',
      slug: 'counter-qr',
      active: true,
      created_at: now,
    },
    {
      id: 'residence-inn',
      business_id: businessId,
      name: 'Legacy Table Stand QR',
      slug: 'residence-inn',
      active: true,
      created_at: now,
    },
  ];

  for (const c of campaigns) {
    await db.collection('campaigns').doc(c.id).set(c);
  }
  console.log('✅ Created restaurant campaigns: motu-seth, table-qr, counter-qr, residence-inn');

  // 3. Authentic Restaurant Menu Items (menu_items collection)
  const menuItems = [
    { id: 'item-1', business_id: businessId, name: { en: 'Motu Seth Special Biryani' }, position: 1, active: true },
    { id: 'item-2', business_id: businessId, name: { en: 'Chicken Dum Biryani' }, position: 2, active: true },
    { id: 'item-3', business_id: businessId, name: { en: 'Mutton Handi Special' }, position: 3, active: true },
    { id: 'item-4', business_id: businessId, name: { en: 'Tandoori Chicken & Kebab Platter' }, position: 4, active: true },
    { id: 'item-5', business_id: businessId, name: { en: 'Paneer Malai & Peri Peri Tikka' }, position: 5, active: true },
    { id: 'item-6', business_id: businessId, name: { en: 'Butter Chicken Masala' }, position: 6, active: true },
    { id: 'item-7', business_id: businessId, name: { en: 'Paneer Butter Masala & Kadhai Paneer' }, position: 7, active: true },
    { id: 'item-8', business_id: businessId, name: { en: 'Dal Makhani & Handi Gravy' }, position: 8, active: true },
    { id: 'item-9', business_id: businessId, name: { en: 'Butter Naan & Garlic Naan' }, position: 9, active: true },
    { id: 'item-10', business_id: businessId, name: { en: 'Special Rolls & Starters' }, position: 10, active: true },
    { id: 'item-11', business_id: businessId, name: { en: 'Gulab Jamun with Ice Cream' }, position: 11, active: true },
  ];

  for (const m of menuItems) {
    await db.collection('menu_items').doc(m.id).set(m);
    // Also mirror to residence-inn business_id
    await db.collection('menu_items').doc(`res-${m.id}`).set({ ...m, id: `res-${m.id}`, business_id: 'residence-inn' });
  }
  console.log('✅ Created 11 restaurant menu items');

  // 4. Restaurant Questions
  const questions = [
    { id: 'q-overall', business_id: businessId, key: 'overall_rating', type: 'rating', text: { en: 'Overall Dining Experience' }, position: 1 },
    { id: 'q-food', business_id: businessId, key: 'food_rating', type: 'rating', text: { en: 'Food & Flavors' }, position: 2 },
    { id: 'q-service', business_id: businessId, key: 'service_rating', type: 'rating', text: { en: 'Hospitality & Service' }, position: 3 },
    { id: 'q-liked', business_id: businessId, key: 'liked', type: 'multi_choice', text: { en: 'What did you like most?' }, position: 4 },
    { id: 'q-ordered', business_id: businessId, key: 'ordered', type: 'multi_choice', text: { en: 'Dishes Ordered Today' }, position: 5 },
    { id: 'q-contact', business_id: businessId, key: 'customer_contact', type: 'text', text: { en: 'Diner Contact Details' }, position: 6 },
  ];

  for (const q of questions) {
    await db.collection('questions').doc(q.id).set(q);
  }
  console.log('✅ Created 6 restaurant survey questions');

  // 5. Admin Users for dashboard authentication
  const adminUsers = [
    {
      id: 'admin-motuseth',
      email: 'admin@motuseth.com',
      username: 'admin',
      password_hash: hashPassword('password123'),
      role: 'owner',
      business_id: businessId,
      created_at: now,
    },
    {
      id: 'owner-motuseth',
      email: 'owner@motuseth.com',
      username: 'owner',
      password_hash: hashPassword('password123'),
      role: 'owner',
      business_id: businessId,
      created_at: now,
    },
    {
      id: 'admin-residency',
      email: 'admin@residency.com',
      username: 'admin',
      password_hash: hashPassword('password123'),
      role: 'owner',
      business_id: businessId,
      created_at: now,
    },
  ];

  for (const u of adminUsers) {
    await db.collection('users').doc(u.id).set(u);
  }
  console.log('✅ Created admin users in Firestore: admin@motuseth.com / admin (password123)');

  console.log('\n🎉 Fresh Firestore database seeded successfully for Motu Seth Restaurant!');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
