export const connectSocialAccount = async (platform: string, authCode: string) => {
  try {
    const response = await fetch('/api/social/connect', {
      method: 'POST',
      body: JSON.stringify({
        platform,
        authCode,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to connect social account');
    }

    return await response.json();
  } catch (error) {
    throw new Error(`Failed to connect social account: ${error}`);
  }
};