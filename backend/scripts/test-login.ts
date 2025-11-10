import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testLogin() {
  console.log('🧪 Testing user login\n');

  // Test 1: Login with correct credentials
  console.log('1️⃣ Test 1: Login with valid credentials');
  try {
    const response1 = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@gearted.com',
      password: 'Test123!'
    });
    console.log('✅ Success: Logged in');
    console.log('   User:', response1.data.data.user.email);
    console.log('   Access Token:', response1.data.data.tokens.accessToken.substring(0, 50) + '...');
    console.log('');
  } catch (error: any) {
    console.log('❌ Failed:', error.response?.data?.error?.message || error.message);
    console.log('');
  }

  // Test 2: Login with wrong password
  console.log('2️⃣ Test 2: Login with wrong password (should fail)');
  try {
    const response2 = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@gearted.com',
      password: 'WrongPassword!'
    });
    console.log('❌ ERROR: Wrong password was accepted!');
    console.log('');
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('✅ Success: Login rejected');
      console.log('   Message:', error.response.data.error.message);
      console.log('');
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
      console.log('');
    }
  }

  // Test 3: Login with non-existent email
  console.log('3️⃣ Test 3: Login with non-existent email (should fail)');
  try {
    const response3 = await axios.post(`${API_URL}/auth/login`, {
      email: 'nonexistent@gearted.com',
      password: 'Test123!'
    });
    console.log('❌ ERROR: Non-existent user was accepted!');
    console.log('');
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('✅ Success: Login rejected');
      console.log('   Message:', error.response.data.error.message);
      console.log('');
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
      console.log('');
    }
  }

  console.log('✅ All tests completed!');
}

testLogin();
