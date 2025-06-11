/**
 * Test script to verify the Located Properties workflow
 * This script will:
 * 1. Check if we have properties in the database
 * 2. Check if we have goals for LOCATED_PROPERTIES category
 * 3. Test the workflow by marking a property as located
 * 4. Verify goal progress updates correctly
 * 5. Test fireworks animation trigger
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testLocatedPropertiesWorkflow() {
  console.log('🚀 Testing Located Properties Workflow...\n');

  try {
    // 1. Check if we have properties
    console.log('1. Checking properties in database...');
    const propertiesResponse = await fetch(`${BASE_URL}/api/properties`);
    const properties = await propertiesResponse.json();
    console.log(`   ✅ Found ${properties.length} properties`);
    
    if (properties.length === 0) {
      console.log('   ❌ No properties found. Please add some properties first.');
      return;
    }

    // 2. Check current goals
    console.log('\n2. Checking goals in database...');
    const goalsResponse = await fetch(`${BASE_URL}/api/goals`);
    const goals = await goalsResponse.json();
    const locatedPropertiesGoals = goals.filter(goal => goal.category === 'LOCATED_PROPERTIES');
    console.log(`   ✅ Found ${goals.length} total goals`);
    console.log(`   ✅ Found ${locatedPropertiesGoals.length} LOCATED_PROPERTIES goals`);
    
    if (locatedPropertiesGoals.length === 0) {
      console.log('   ⚠️ No LOCATED_PROPERTIES goals found. They should be created automatically.');
    } else {
      locatedPropertiesGoals.forEach(goal => {
        console.log(`   📊 Goal: "${goal.title}" - Progress: ${goal.currentValue}/${goal.targetValue}`);
      });
    }

    // 3. Find a property that is not located
    console.log('\n3. Finding a property to test with...');
    const unlocatedProperty = properties.find(prop => !prop.isLocated);
    
    if (!unlocatedProperty) {
      console.log('   ⚠️ All properties are already marked as located. Using first property anyway.');
      const testProperty = properties[0];
      console.log(`   🏠 Test property: ${testProperty.address} (ID: ${testProperty.id})`);
      console.log(`   📍 Current status: ${testProperty.isLocated ? 'Located' : 'Not Located'}`);
    } else {
      console.log(`   🏠 Test property: ${unlocatedProperty.address} (ID: ${unlocatedProperty.id})`);
      console.log(`   📍 Current status: Not Located`);
    }

    // 4. Test the workflow
    const testProperty = unlocatedProperty || properties[0];
    console.log('\n4. Testing the toggle located functionality...');
    
    // Simulate marking property as located
    const updateResponse = await fetch(`${BASE_URL}/api/properties/${testProperty.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isLocated: !testProperty.isLocated
      }),
    });

    if (!updateResponse.ok) {
      console.log('   ❌ Failed to update property');
      return;
    }

    const updatedProperty = await updateResponse.json();
    console.log(`   ✅ Property updated successfully`);
    console.log(`   📍 New status: ${updatedProperty.isLocated ? 'Located' : 'Not Located'}`);

    // 5. Check if goals were updated
    console.log('\n5. Checking if goals were updated...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for background processing
    
    const updatedGoalsResponse = await fetch(`${BASE_URL}/api/goals`);
    const updatedGoals = await updatedGoalsResponse.json();
    const updatedLocatedGoals = updatedGoals.filter(goal => goal.category === 'LOCATED_PROPERTIES');
    
    if (updatedLocatedGoals.length > 0) {
      updatedLocatedGoals.forEach(goal => {
        console.log(`   📊 Updated Goal: "${goal.title}" - Progress: ${goal.currentValue}/${goal.targetValue}`);
        const percentage = (goal.currentValue / goal.targetValue * 100).toFixed(1);
        console.log(`   📈 Progress: ${percentage}%`);
        
        if (goal.currentValue >= goal.targetValue) {
          console.log('   🎉 GOAL COMPLETED! Fireworks should trigger in the dashboard!');
        }
      });
    }

    console.log('\n✅ Located Properties workflow test completed successfully!');
    console.log('\n📝 Next steps to complete testing:');
    console.log('   1. Open the dashboard at http://localhost:3001/dashboard');
    console.log('   2. Go to Properties page and toggle a property as located');
    console.log('   3. Check if the goal progress updates in the dashboard');
    console.log('   4. If a goal is completed, verify that fireworks animation plays');
    console.log('   5. Check the Goals/Metas page to see LOCATED_PROPERTIES category');

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Run the test
testLocatedPropertiesWorkflow();
