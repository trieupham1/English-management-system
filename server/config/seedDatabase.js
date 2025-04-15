const mongoose = require('mongoose');
const User = require('../models/user');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Settings = require('../models/Settings'); // Add this line

const bcrypt = require('bcrypt');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected for seeding');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
};

const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await MenuCategory.deleteMany({});
    await MenuItem.deleteMany({});
    await Table.deleteMany({});
    await Settings.deleteMany({}); // Add this line

    
    console.log('Cleared existing data');
    
    // Hash passwords
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Seed users
    const usersData = [
      { username: 'staff1', password: hashedPassword, name: 'Staff User', role: 'staff' },
      { username: 'kitchen1', password: hashedPassword, name: 'Kitchen User', role: 'kitchen' },
      { username: 'admin1', password: hashedPassword, name: 'Admin User', role: 'admin' }
    ];
    
    const users = await User.insertMany(usersData);
    console.log('Seeded users');
    
    // Seed menu categories
    const categoriesData = [
      { name: 'Noodles', description: 'Hearty Vietnamese soups' },
      { name: 'Rice', description: 'Traditional rice and noodle dishes' },
      { name: 'Additional foods', description: 'More Foods' },
      { name: 'Desserts', description: 'Sweet treats to finish your meal' },
      { name: 'Drinks', description: 'Refreshing beverages' }
    ];
    
    const categories = await MenuCategory.insertMany(categoriesData);
    console.log('Seeded menu categories');
    
    // Create a map for easy lookup
    const categoryMap = {
      1: categories[0]._id, // Noodles
      2: categories[1]._id, // Rice
      3: categories[2]._id, // Additional foods
      4: categories[3]._id, // Desserts
      5: categories[4]._id  // Drinks
    };
    
    const menuItemsData = [
      // Noodles (category_id: 1)
      { 
        category: categoryMap[1], 
        category_id: 1,
        name: 'Phở Bò', 
        price: 60000, 
        image_path: '/images/Pho.jpg', 
        description: 'Traditional beef noodle soup with herbs and bean sprouts', 
        preparation_time: 18,
        status: 'available', // Add this field

        item_id: 101
      },
      { 
        category: categoryMap[1], 
        category_id: 1,
        name: 'Bún Bò Huế', 
        price: 60000, 
        image_path: '/images/bun-bo-hue.jpg', 
        description: 'Spicy beef noodle soup from central Vietnam', 
        preparation_time: 20,
        status: 'available', // Add this field

        item_id: 102
      },
      { 
        category: categoryMap[1], 
        category_id: 1,
        name: 'Bún Chả', 
        price: 50000, 
        image_path: '/images/bun-cha.jpg', 
        description: 'Grilled pork with rice noodles and herbs', 
        preparation_time: 20,
        status: 'available', // Add this field

        item_id: 103
      },
      
      // Rice (category_id: 2)
      { 
        category: categoryMap[2], 
        category_id: 2,
        name: 'Cơm Chiên Hải Sản', 
        price: 60000, 
        image_path: '/images/com-chien.jpg', 
        description: 'Seafood fried rice', 
        preparation_time: 15,
        status: 'available', // Add this field

        item_id: 201
      },
      { 
        category: categoryMap[2], 
        category_id: 2,
        name: 'Cơm Tấm', 
        price: 50000, 
        image_path: '/images/com-tam.jpg', 
        description: 'Broken rice with grilled pork, egg, and vegetables', 
        preparation_time: 15,
        status: 'available', // Add this field

        item_id: 202
      },

      // Additional foods (category_id: 3)
      { 
        category: categoryMap[3], 
        category_id: 3,
        name: 'Bánh Mì Thịt', 
        price: 30000, 
        image_path: '/images/banh-mi.jpg', 
        description: 'Vietnamese sandwich with various meats and vegetables', 
        preparation_time: 10,
        status: 'available', // Add this field

        item_id: 301
      },
      { 
        category: categoryMap[3], 
        category_id: 3,
        name: 'Bánh Xèo', 
        price: 45000, 
        image_path: '/images/banh-xeo.jpg', 
        description: 'Vietnamese crispy pancake with shrimp and bean sprouts', 
        preparation_time: 18,
        status: 'available', // Add this field

        item_id: 302
      },
      {
        category: categoryMap[3],
        category_id: 3,
        name: 'Chả Giò',
        price: 30000,
        image_path: '/images/spring-rolls.jpg',
        description: 'Fried spring rolls with pork and vegetables',
        preparation_time: 15,
        status: 'available', // Add this field

        item_id: 303
      },
      // Desserts (category_id: 4)
      { 
        category: categoryMap[4], 
        category_id: 4,
        name: 'Chè Ba Màu', 
        price: 20000, 
        image_path: '/images/che-ba-mau.jpg', 
        description: 'Three-color dessert with beans, jelly, and coconut milk', 
        preparation_time: 8,
        status: 'available', // Add this field

        item_id: 401
      },
      { 
        category: categoryMap[4], 
        category_id: 4,
        name: 'Bánh Flan', 
        price: 15000, 
        image_path: '/images/banh-flan.jpg', 
        description: 'Vietnamese caramel custard', 
        preparation_time: 5,
        status: 'available', // Add this field

        item_id: 402
      },
      { 
        category: categoryMap[4], 
        category_id: 4,
        name: 'Chè Đậu Xanh', 
        price: 15000, 
        image_path: '/images/che-dau-xanh.jpg', 
        description: 'Mung bean pudding with coconut cream', 
        preparation_time: 6,
        status: 'available', // Add this field

        item_id: 403
      },
      
      // Drinks (category_id: 5)
      { 
        category: categoryMap[5], 
        category_id: 5,
        name: 'Cà Phê Sữa Đá', 
        price: 15000, 
        image_path: '/images/ca-phe-sua-da.jpg', 
        description: 'Vietnamese iced coffee with condensed milk', 
        preparation_time: 5,
        status: 'available', // Add this field

        item_id: 501
      },
      { 
        category: categoryMap[5], 
        category_id: 5,
        name: 'Trà Lipton', 
        price: 10000, 
        image_path: '/images/iced-tea.jpg', 
        description: 'Vietnamese iced tea', 
        preparation_time: 3,
        status: 'available', // Add this field

        item_id: 502
      },
      { 
        category: categoryMap[5], 
        category_id: 5,
        name: 'Sinh Tố Bơ', 
        price: 25000, 
        image_path: '/images/sinh-to-bo.jpg', 
        description: 'Avocado smoothie with condensed milk', 
        preparation_time: 5,
        status: 'available', // Add this field

        item_id: 503
      }
    ];
    
    await MenuItem.insertMany(menuItemsData);
    console.log('Seeded menu items');
    // Seed settings
    const settingsData = {
      restaurantName: "Viet Nam Cuisine",
      contactNumber: "(+84) 123 456 789",
      email: "info@vietnamcuisine.com",
      taxRate: 10,
      tableCount: 8,
      reservedTables: [5],
      primaryColor: "#B32821",
      secondaryColor: "#4B6F44"
    };
    await Settings.create(settingsData);
console.log('Seeded settings');
    
    
    // Seed tables
    const tablesData = [
      { table_number: 1, status: 'available', capacity: 2 },
      { table_number: 2, status: 'occupied', capacity: 2 },
      { table_number: 3, status: 'occupied', capacity: 4 },
      { table_number: 4, status: 'available', capacity: 4 },
      { table_number: 5, status: 'reserved', capacity: 6 },
      { table_number: 6, status: 'available', capacity: 6 },
      { table_number: 7, status: 'available', capacity: 8 },
      { table_number: 8, status: 'available', capacity: 8 }
    ];
    
    await Table.insertMany(tablesData);
    console.log('Seeded tables');
    
    console.log('Database successfully seeded!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Execute the seeding process
const runSeed = async () => {
  const connected = await connectDB();
  
  if (connected) {
    await seedDatabase();
    console.log('Completed. Disconnecting...');
    mongoose.disconnect();
  }
};


runSeed();