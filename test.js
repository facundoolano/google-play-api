import newman from 'newman';
import collectionData from './PostmanCollections/GooglePlayAPI.postman_collection.json' assert { type: "json" };
import environmentData from './PostmanCollections/postman_environment.json' assert { type: "json" };

const runTests = async () => {
  try {
    await newman.run({
      collection: collectionData,
      environment: environmentData,
      reporters: 'cli'
    });

    console.log('API tests completed successfully!');
  } catch (err) {
    console.error('Newman encountered an error:', err);
    process.exit(1);
  }
};

runTests();
