const { pool } = require('./db');
const initDb = require('./initDb');

const seedData = async () => {
  await initDb();
  console.log('Seeding initial data...');

  try {
    const connection = await pool.getConnection();

    // Check if categories already exist
    const [existingCats] = await connection.query('SELECT COUNT(*) as count FROM categories');
    if (existingCats[0].count === 0) {
      const categories = [
        ['Running', 'running', 'High-performance running shoes built for speed and endurance', 'images/shoe1.jpg'],
        ['Casual', 'casual', 'Stylish and comfortable everyday sneakers', 'images/shoe2.jpg'],
        ['Training', 'training', 'Versatile cross-training and gym shoes', 'images/shoe3.jpg'],
        ['Basketball', 'basketball', 'High-top athletic shoes with superior ankle support', 'images/shoe4.jpg'],
        ['Tennis', 'tennis', 'Durable court shoes designed for peak agility', 'images/shoe5.jpg']
      ];

      for (const cat of categories) {
        await connection.query(
          'INSERT INTO categories (name, slug, description, image_url) VALUES (?, ?, ?, ?)',
          cat
        );
      }
      console.log('Categories seeded.');
    }

    // Check if products already exist
    const [existingProducts] = await connection.query('SELECT COUNT(*) as count FROM products');
    if (existingProducts[0].count === 0) {
      // Get category IDs
      const [cats] = await connection.query('SELECT id, slug FROM categories');
      const catMap = {};
      cats.forEach(c => { catMap[c.slug] = c.id; });

      const products = [
        [catMap['running'], "Vyrox SpeedRunner Pro", "vyrox-speedrunner-pro", "Vyrox", 3999.00, 3499.00, "Engineered for explosive marathon speed and light responsiveness.", "images/shoe1.jpg", 1],
        [catMap['casual'], "Vyrox Street Flex", "vyrox-street-flex", "Vyrox", 3499.00, null, "Sleek streetwear design combined with ultra-soft cushioning.", "images/shoe2.jpg", 1],
        [catMap['training'], "Vyrox Impact Trainer", "vyrox-impact-trainer", "Vyrox", 1699.00, 1499.00, "Maximum stability and grip for heavy gym workouts.", "images/shoe3.jpg", 0],
        [catMap['basketball'], "Vyrox HighFlyer", "vyrox-highflyer", "Vyrox", 2500.00, null, "High-top lockdown with high-rebound jump support.", "images/shoe4.jpg", 1],
        [catMap['tennis'], "Vyrox Court Ace", "vyrox-court-ace", "Vyrox", 6999.00, 5999.00, "Reinforced toe drag protection and lateral support.", "images/shoe5.jpg", 0],
        [catMap['training'], "Vyrox Trail Blazer", "vyrox-trail-blazer", "Vyrox", 1999.00, null, "Rugged outsole for all-terrain adventure and training.", "images/shoe6.jpg", 0],
        [catMap['running'], "Vyrox Marathon Elite", "vyrox-marathon-elite", "Vyrox", 4999.00, 4499.00, "Carbon fiber plate feel with maximum energy return.", "images/shoe7.jpg", 1],
        [catMap['running'], "Vyrox Swift Runner", "vyrox-swift-runner", "Vyrox", 2999.00, null, "Lightweight mesh upper for cool everyday road running.", "images/shoe8.jpg", 0],
        [catMap['casual'], "Vyrox Urban Glide", "vyrox-urban-glide", "Vyrox", 3600.00, 3199.00, "Minimalist luxury sneaker crafted with breathable fabric.", "images/shoe9.jpg", 0],
        [catMap['training'], "Vyrox PowerFit Gym", "vyrox-powerfit-gym", "Vyrox", 4500.00, null, "Firm heel platform designed for deadlifts and squats.", "images/shoe10.jpg", 1],
        [catMap['basketball'], "Vyrox Dunk Master", "vyrox-dunk-master", "Vyrox", 1299.00, null, "Durable court rubber outsole for outdoor streetball.", "images/shoe11.jpg", 0],
        [catMap['tennis'], "Vyrox Match Point", "vyrox-match-point", "Vyrox", 3999.00, 3499.00, "Breathable upper with responsive court feel.", "images/shoe12.jpg", 0]
      ];

      for (const prod of products) {
        const [res] = await connection.query(
          `INSERT INTO products (category_id, name, slug, brand, price, discount_price, description, image_url, is_featured)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          prod
        );
        const productId = res.insertId;

        // Seed sizes for product
        const sizes = ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'];
        for (const sz of sizes) {
          await connection.query(
            'INSERT INTO product_sizes (product_id, size, stock) VALUES (?, ?, ?)',
            [productId, sz, 15]
          );
        }
      }
      console.log('Products and size variants seeded successfully.');
    }

    connection.release();
    console.log('Data seeding process complete!');
  } catch (err) {
    console.error('Error seeding database:', err.message);
  }
};

if (require.main === module) {
  seedData().then(() => process.exit());
}

module.exports = seedData;
