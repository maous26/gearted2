import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testFullRegistration() {
  console.log('🧪 Testing full user registration with all profile info\n');

  const testUser = {
    email: 'testfull@gearted.com',
    username: 'testfull',
    password: 'TestFull123!',
    firstName: 'Jean',
    lastName: 'Dupont',
    location: 'Paris, 75001'
  };

  console.log('📝 Registering user with profile data:');
  console.log('   Email:', testUser.email);
  console.log('   Username:', testUser.username);
  console.log('   First Name:', testUser.firstName);
  console.log('   Last Name:', testUser.lastName);
  console.log('   Location:', testUser.location);
  console.log('');

  try {
    // Test 1: Register with full profile
    const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
    
    console.log('✅ Registration successful!');
    console.log('📊 User data returned:');
    console.log('   ID:', registerResponse.data.data.user.id);
    console.log('   Email:', registerResponse.data.data.user.email);
    console.log('   Username:', registerResponse.data.data.user.username);
    console.log('   First Name:', registerResponse.data.data.user.firstName);
    console.log('   Last Name:', registerResponse.data.data.user.lastName);
    console.log('   Location:', registerResponse.data.data.user.location);
    console.log('   Active:', registerResponse.data.data.user.isActive);
    console.log('   Email Verified:', registerResponse.data.data.user.isEmailVerified);
    console.log('   Role:', registerResponse.data.data.user.role);
    console.log('');

    // Verify all fields are present
    const user = registerResponse.data.data.user;
    const checks = [
      { field: 'firstName', value: user.firstName, expected: testUser.firstName },
      { field: 'lastName', value: user.lastName, expected: testUser.lastName },
      { field: 'location', value: user.location, expected: testUser.location },
      { field: 'email', value: user.email, expected: testUser.email.toLowerCase() },
      { field: 'username', value: user.username, expected: testUser.username }
    ];

    console.log('🔍 Verification:');
    let allValid = true;
    checks.forEach(check => {
      const isValid = check.value === check.expected;
      allValid = allValid && isValid;
      console.log(`   ${isValid ? '✅' : '❌'} ${check.field}: ${check.value} ${isValid ? '==' : '!='} ${check.expected}`);
    });
    console.log('');

    if (allValid) {
      console.log('🎉 All profile information correctly persisted!');
    } else {
      console.log('⚠️  Some profile information is missing or incorrect');
    }

    // Test 2: Login and verify profile is returned
    console.log('\n🔐 Testing login to verify profile persistence...\n');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    console.log('✅ Login successful!');
    console.log('📊 Profile data from login:');
    const loginUser = loginResponse.data.data.user;
    console.log('   First Name:', loginUser.firstName);
    console.log('   Last Name:', loginUser.lastName);
    console.log('   Location:', loginUser.location);
    console.log('');

    if (loginUser.firstName === testUser.firstName && 
        loginUser.lastName === testUser.lastName && 
        loginUser.location === testUser.location) {
      console.log('🎉 Profile successfully retrieved on login!');
    } else {
      console.log('⚠️  Profile data not matching after login');
    }

  } catch (error: any) {
    console.log('❌ Test failed:', error.response?.data?.error?.message || error.message);
    if (error.response?.data) {
      console.log('   Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFullRegistration();
