// Mock HTTP client for the Signin page
// This provides mock functionality without dependencies on external libraries

const mockHttpClient = {
  get: (url) => {
    // Return a mock response that simulates the geo location API
    return Promise.resolve({
      data: {
        country: "US",
        region: "California",
        city: "San Francisco",
        ip: "8.8.8.8"
      }
    });
  },
  post: (url, data) => {
    return Promise.resolve({ data: {} });
  },
  put: (url, data) => {
    return Promise.resolve({ data: {} });
  },
  delete: (url) => {
    return Promise.resolve({ data: {} });
  }
};

export default mockHttpClient;
