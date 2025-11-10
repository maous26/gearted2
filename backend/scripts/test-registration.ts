import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testRegistration() {
  console.log('🧪 Testing user registration and duplicate detection\n');

  // Test 1: Register first user
  console.log('1️⃣ Test 1: Register new user (should succeed)');
  try {
    const response1 = await axios.post(`${API_URL}/auth/register`, {
      email: 'test@gearted.com',
      username: 'testuser',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User'
    });
    console.log('✅ Success:', response1.data.data.message);
    console.log('   User:', response1.data.data.user.email, '-', response1.data.data.user.username);
    console.log('');
  } catch (error: any) {
    console.log('❌ Failed:', error.response?.data?.error?.message || error.message);
    console.log('');
  }

  // Test 2: Try to register with same email (should fail)
  console.log('2️⃣ Test 2: Register with duplicate email (should fail)');
  try {
    const response2 = await axios.post(`${API_URL}/auth/register`, {
      email: 'test@gearted.com',
      username: 'differentuser',
      password: 'Test456!',
      firstName: 'Another',
      lastName: 'User'
    });
    console.log('❌ ERROR: Duplicate email was accepted!');
    console.log('');
  } catch (error: any) {
    if (error.response?.status === 409) {
      console.log('✅ Success: Duplicate detected');
      console.log('   Message:', error.response.data.error.message);
      console.log('   Field:', error.response.data.error.field);
      console.log('');
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
      console.log('');
    }
  }

  // Test 3: Try to register with same username (should fail)
  console.log('3️⃣ Test 3: Register with duplicate username (should fail)');
  try {
    const response3 = await axios.post(`${API_URL}/auth/register`, {
      email: 'another@gearted.com',
      username: 'testuser',
      password: 'Test789!',
      firstName: 'Yet Another',
      lastName: 'User'
    });
    console.log('❌ ERROR: Duplicate username was accepted!');
    console.log('');
  } catch (error: any) {
    if (error.response?.status === 409) {
      console.log('✅ Success: Duplicate detected');
      console.log('   Message:', error.response.data.error.message);
      console.log('   Field:', error.response.data.error.field);
      console.log('');
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
      console.log('');
    }
  }

  // Test 4: Register second valid user (should succeed)
  console.log('4️⃣ Test 4: Register second valid user (should succeed)');
  try {
    const response4 = await axios.post(`${API_URL}/auth/register`, {
      email: 'user2@gearted.com',
      username: 'seconduser',
      password: 'Pass123!',
      firstName: 'Second',
      lastName: 'User'
    });
    console.log('✅ Success:', response4.data.data.message);
    console.log('   User:', response4.data.data.user.email, '-', response4.data.data.user.username);
    console.log('');
  } catch (error: any) {
    console.log('❌ Failed:', error.response?.data?.error?.message || error.message);
    console.log('');
  }

  console.log('✅ All tests completed!');
}

testRegistration();
