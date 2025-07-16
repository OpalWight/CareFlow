const fetch = require('node-fetch');

/**
 * Fetches user profile data from Google's OAuth2 API.
 * @param {string} accessToken - The access token obtained from Google.
 * @returns {Promise<Object>} The user data from Google.
 */
async function getGoogleUserData(accessToken) {
  try {
    console.log('👤 Fetching user data from Google...');
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    console.log('✅ User data received:', {
      email: data.email,
      name: data.name,
      picture: data.picture ? 'Present' : 'Missing'
    });

    return data;
  } catch (error) {
    console.error('❌ Error fetching user data from Google:', error);
    throw error;
  }
}

module.exports = { getGoogleUserData };
