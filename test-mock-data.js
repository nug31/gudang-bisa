import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testMockData() {
  try {
    console.log('Testing mock data...');
    
    // Check if mock data file exists
    const mockDataPath = path.join(__dirname, 'src', 'data', 'mockData.json');
    
    try {
      await fs.access(mockDataPath);
      console.log(`✅ Mock data file exists at ${mockDataPath}`);
      
      // Read the mock data
      const mockDataContent = await fs.readFile(mockDataPath, 'utf8');
      const mockData = JSON.parse(mockDataContent);
      
      // Print some statistics
      console.log('\nMock Data Statistics:');
      console.log(`- Users: ${mockData.users.length}`);
      console.log(`- Categories: ${mockData.categories.length}`);
      console.log(`- Item Requests: ${mockData.item_requests.length}`);
      console.log(`- Comments: ${mockData.comments.length}`);
      console.log(`- Notifications: ${mockData.notifications.length}`);
      
      // Print sample data
      console.log('\nSample User:');
      console.log(mockData.users[0]);
      
      console.log('\nSample Category:');
      console.log(mockData.categories[0]);
      
      console.log('\nSample Item Request:');
      console.log(mockData.item_requests[0]);
      
      console.log('\n✅ Mock data is valid and contains the expected structure');
    } catch (err) {
      console.error(`❌ Mock data file does not exist or is not accessible: ${err.message}`);
      
      // Check if the directory exists
      const dataDir = path.join(__dirname, 'src', 'data');
      try {
        await fs.access(dataDir);
        console.log(`The directory ${dataDir} exists, but the mockData.json file is missing`);
      } catch (dirErr) {
        console.error(`The directory ${dataDir} does not exist`);
      }
    }
  } catch (error) {
    console.error('Error testing mock data:', error);
  }
}

testMockData();
