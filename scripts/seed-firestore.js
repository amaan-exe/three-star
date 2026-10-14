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
  console.log('Seeding fresh Firestore database for Residence Inn (star-e7eb0)...');

  const now = new Date().toISOString();

  // 1. Business
  const businessId = 'residence-inn';
  await db.collection('businesses').doc(businessId).set({
    id: businessId,
    name: 'Residence Inn',
    category: 'hotel',
    location: 'behind P&M Mall and Ion Digital Zone, near Vishwakarma Mandir, Patliputra Industrial Area, Patliputra Colony, Patna, Bihar 800013',
    phone: '6201699943',
    secondary_phone: '6201699943',
    timezone: 'Asia/Kolkata',
    primary_color: '#d97706',
    welcome_message: {
      en: 'Welcome to Residence Inn! Share your honest hotel stay experience with us in 30 seconds. For reception & room service call 6201699943.',
    },
    google_review_url: 'https://search.google.com/local/writereview?placeid=ChIJkaqpBNhX7TkRe6PNrOcTDZU',
    owner_id: 'owner-residence-inn',
    owner_email: 'admin@residency.com',
    default_language: 'en',
    created_at: now,
    updated_at: now,
  });
  console.log('✅ Created business doc: residence-inn (hotel)');

  // 2. Campaigns
  const campaigns = [
    {
      id: 'residence-inn',
      business_id: businessId,
      name: 'Room Keycard & Desk QR',
      slug: 'residence-inn',
      active: true,
      created_at: now,
    },
    {
      id: 'reception',
      business_id: businessId,
      name: 'Reception & Front Desk Stand',
      slug: 'reception',
      active: true,
      created_at: now,
    },
    {
      id: 'room-service',
      business_id: businessId,
      name: 'In-Room Directory QR',
      slug: 'room-service',
      active: true,
      created_at: now,
    },
  ];

  for (const c of campaigns) {
    await db.collection('campaigns').doc(c.id).set(c);
  }
  console.log('✅ Created hotel campaigns: residence-inn, reception, room-service');

  // 3. Room Types & Hotel Services (menu_items collection)
  const menuItems = [
    { id: 'item-1', business_id: businessId, name: { en: 'Executive Deluxe Room' }, position: 1, active: true },
    { id: 'item-2', business_id: businessId, name: { en: 'Premium King Suite' }, position: 2, active: true },
    { id: 'item-3', business_id: businessId, name: { en: 'Cozy Standard AC Room' }, position: 3, active: true },
    { id: 'item-4', business_id: businessId, name: { en: 'Complimentary Buffet Breakfast' }, position: 4, active: true },
    { id: 'item-5', business_id: businessId, name: { en: '24/7 In-Room Dining' }, position: 5, active: true },
    { id: 'item-6', business_id: businessId, name: { en: 'High-Speed Wi-Fi & Work Desk' }, position: 6, active: true },
    { id: 'item-7', business_id: businessId, name: { en: 'Express Check-in & Check-out' }, position: 7, active: true },
    { id: 'item-8', business_id: businessId, name: { en: 'Airport & Railway Pick-up / Drop' }, position: 8, active: true },
    { id: 'item-9', business_id: businessId, name: { en: 'Daily Housekeeping & Laundry' }, position: 9, active: true },
  ];

  for (const m of menuItems) {
    await db.collection('menu_items').doc(m.id).set(m);
  }
  console.log('✅ Created 9 room types & hotel services');

  // 4. Questions
  const questions = [
    { id: 'q-overall', business_id: businessId, key: 'overall_rating', type: 'rating', text: { en: 'Overall Hotel Stay' }, position: 1 },
    { id: 'q-food', business_id: businessId, key: 'food_rating', type: 'rating', text: { en: 'Room Comfort & Cleanliness' }, position: 2 },
    { id: 'q-service', business_id: businessId, key: 'service_rating', type: 'rating', text: { en: 'Hospitality & Staff' }, position: 3 },
    { id: 'q-liked', business_id: businessId, key: 'liked', type: 'multi_choice', text: { en: 'Stay Highlights' }, position: 4 },
    { id: 'q-ordered', business_id: businessId, key: 'ordered', type: 'multi_choice', text: { en: 'Rooms & Services Experienced' }, position: 5 },
    { id: 'q-contact', business_id: businessId, key: 'customer_contact', type: 'text', text: { en: 'Guest Contact Details' }, position: 6 },
  ];

  for (const q of questions) {
    await db.collection('questions').doc(q.id).set(q);
  }
  console.log('✅ Created 6 default questions');

  // 5. Admin Users for dashboard authentication
  const adminUsers = [
    {
      id: 'admin-residency',
      email: 'admin@residency.com',
      username: 'admin',
      password_hash: hashPassword('password123'),
      role: 'owner',
      business_id: businessId,
      created_at: now,
    },
    {
      id: 'owner-residency',
      email: 'owner@residency.com',
      username: 'owner',
      password_hash: hashPassword('password123'),
      role: 'owner',
      business_id: businessId,
      created_at: now,
    },
  ];

  for (const u of adminUsers) {
    await db.collection('users').doc(u.id).set(u);
  }
  console.log('✅ Created admin users in Firestore: admin@residency.com (password123)');

  console.log('\n🎉 Fresh Firestore database seeded successfully without any prior responses!');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
