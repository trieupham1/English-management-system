const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'mongodb_export');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function exportAllCollections() {
  // Your MongoDB connection string
  const uri = "mongodb+srv://kxck:d7NWu9Ulrm6EfpTi@englishcenter.rgssonp.mongodb.net/";
  const client = new MongoClient(uri);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    
    // Get database name (using the default database in the connection string)
    const dbName = uri.split('/').pop() || 'test';
    console.log(`Using database: ${dbName}`);
    
    const db = client.db(dbName);
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections`);
    
    // Export each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`Exporting collection: ${collectionName}`);
      
      const collection = db.collection(collectionName);
      const documents = await collection.find({}).toArray();
      
      // Save to file
      const outputPath = path.join(outputDir, `${collectionName}.json`);
      fs.writeFileSync(
        outputPath, 
        JSON.stringify(documents, null, 2)
      );
      
      console.log(`Exported ${documents.length} documents to ${outputPath}`);
    }
    
    console.log('Export complete! Files saved to:', outputDir);
  } catch (error) {
    console.error('Error during export:', error);
  } finally {
    await client.close();
  }
}

// Run the export function
exportAllCollections().catch(console.error);