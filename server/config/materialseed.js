/**
 * Material Seed File
 * 
 * Deletes existing material records and replaces with corrected ones
 * Run with: node materialseed.js
 */

const mongoose = require('mongoose');

// IMPORTANT: Replace this with your actual MongoDB connection string
const MONGO_URI = 'mongodb+srv://kxck:d7NWu9Ulrm6EfpTi@englishcenter.rgssonp.mongodb.net/';
// If you're using MongoDB Atlas or another provider, the URI might look like:
// const MONGO_URI = 'mongodb+srv://username:password@cluster.mongodb.net/your_database_name';

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Load the Material model
// If you get a MissingSchemaError, uncomment the following line and adjust the path:
// require('../models/Material');
const Material = require('../models/Material');

// Data to be seeded
const materials = [
  {
    _id: new mongoose.Types.ObjectId("681324ef882466c61f89860b"),
    title: "IELTS Speaking Practice",
    course: new mongoose.Types.ObjectId("681324ee882466c61f8985ee"),
    type: "audio", // Changed to lowercase to match enum
    description: "Sample IELTS speaking test with examiner feedback",
    file: "ielts_speaking.mp3",
    uploadedBy: new mongoose.Types.ObjectId("681324ee882466c61f8985e9"), // Changed from createdBy to uploadedBy
    tags: ["speaking", "practice", "ielts"],
    downloadCount: 0,
    viewCount: 0,
    createdAt: new Date("2025-05-01T07:38:23.385Z"),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId("681324ef882466c61f89860c"),
    title: "TOEFL Structure Tutorial",
    course: new mongoose.Types.ObjectId("681324ee882466c61f8985ef"),
    type: "video", // Changed to valid enum value
    description: "A comprehensive overview of the TOEFL test structure",
    url: "https://example.com/toefl-tutorial", // Keeping URL field
    uploadedBy: new mongoose.Types.ObjectId("681324ee882466c61f8985e9"), // Changed from createdBy to uploadedBy
    tags: ["toefl", "tutorial"],
    downloadCount: 0,
    viewCount: 0,
    createdAt: new Date("2025-05-01T07:38:23.385Z"),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId("681324ef882466c61f898609"),
    title: "Conversation Basics Slides",
    course: new mongoose.Types.ObjectId("681324ee882466c61f8985ec"),
    type: "slides", // Valid enum value
    description: "Introduction to basic conversation structures and greetings",
    file: "conversation_basics.pdf",
    uploadedBy: new mongoose.Types.ObjectId("681324ee882466c61f8985e8"), // Changed from createdBy to uploadedBy
    tags: ["conversation", "slides"],
    downloadCount: 0,
    viewCount: 0,
    createdAt: new Date("2025-05-01T07:38:23.385Z"),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId("681324ef882466c61f89860a"),
    title: "Business Vocabulary List",
    course: new mongoose.Types.ObjectId("681324ee882466c61f8985ed"),
    type: "document", // Valid enum value
    description: "Essential vocabulary for business communications",
    file: "business_vocab.docx",
    uploadedBy: new mongoose.Types.ObjectId("681324ee882466c61f8985e8"), // Changed from createdBy to uploadedBy
    tags: ["business", "vocabulary"],
    downloadCount: 0,
    viewCount: 0,
    createdAt: new Date("2025-05-01T07:38:23.385Z"),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId("68177d0af764d6965c60ded7"),
    title: "Up uop",
    description: "Up ",
    type: "document", // Already valid enum value
    course: new mongoose.Types.ObjectId("681324ee882466c61f8985ef"),
    file: "file-1746369802729-355180273.docx",
    uploadedBy: new mongoose.Types.ObjectId("681333f573460c095068d8a6"),
    tags: ["worksheet"],
    downloadCount: 0,
    viewCount: 0,
    createdAt: new Date("2025-05-04T14:43:22.786Z"),
    updatedAt: new Date("2025-05-04T14:43:22.786Z")
  },
  // Add new records for the files you're trying to download
  {
    _id: new mongoose.Types.ObjectId(),
    title: "Vocabulary List",
    course: new mongoose.Types.ObjectId("681324ee882466c61f8985ee"),
    type: "document",
    description: "Complete IELTS vocabulary list",
    file: "22099-vocabulary-list.pdf", // Exactly matching the filename in your uploads folder
    uploadedBy: new mongoose.Types.ObjectId("681324ee882466c61f8985e9"),
    tags: ["vocabulary", "ielts"],
    downloadCount: 0,
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    title: "Everyday Dialogues",
    course: new mongoose.Types.ObjectId("681324ee882466c61f8985ee"),
    type: "document",
    description: "Common conversational dialogues for everyday situations",
    file: "b_dialogues_everyday_conversations.pdf", // Exactly matching the filename in your uploads folder
    uploadedBy: new mongoose.Types.ObjectId("681324ee882466c61f8985e9"),
    tags: ["dialogues", "conversation"],
    downloadCount: 0,
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    title: "ITP Practice Test",
    course: new mongoose.Types.ObjectId("681324ee882466c61f8985ee"),
    type: "document",
    description: "ITP Practice Test Level 1",
    file: "itp-practice-test-level-1-volume-1.pdf", // Exactly matching the filename in your uploads folder
    uploadedBy: new mongoose.Types.ObjectId("681324ee882466c61f8985e9"),
    tags: ["test", "practice"],
    downloadCount: 0,
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Function to seed the database
async function seedDatabase() {
  try {
    // Delete all existing materials
    await Material.deleteMany({});
    console.log('Deleted all existing materials');

    // Insert new materials
    await Material.insertMany(materials);
    console.log(`Successfully inserted ${materials.length} materials`);

    console.log('Database seeding completed!');
    
    // Print updated records
    const updatedRecords = await Material.find({}).lean();
    console.log('Updated records count:', updatedRecords.length);
    
    // Disconnect from database
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();