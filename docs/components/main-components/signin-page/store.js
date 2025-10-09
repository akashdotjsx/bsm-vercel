// Mock authentication store for the Signin component
// This is a simplified version without full state management

// Mock initial state
const mockAuthState = {
  signInData: { email: "" },
  signInError: { email: "", disabled: false, loader: false },
  signInContinueData: { password: "" },
  signInContinueError: { password: "", disabled: false, loader: false },
  forgotPasswordData: { email: "" }
};

// Mock store functions
export const useAuthenticationStore = (selector) => {
  // This is a simplified mock that returns static data
  // In a real implementation, you would need a proper state management solution
  const state = mockAuthState;
  return selector ? selector(state) : state;
};

// Mock actions
export const mockFetchSigninData = (data, navigate, redirectUrl) => {
  console.log("Mock signin data fetch", data);
  // Add your mock authentication logic here
  // This is where you'd typically make an API call
};

export const mockFetchSigninContinueData = (data, navigate, redirectUrl) => {
  console.log("Mock signin continue data fetch", data);
  // Add your mock authentication logic here
  // This is where you'd typically make an API call
};

// Expose the mock actions without making them part of the store
export const mockActions = {
  fetchSigninData: mockFetchSigninData,
  fetchSigninContinueData: mockFetchSigninContinueData
};