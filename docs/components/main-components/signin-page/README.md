# Signin Page Component

This is a self-contained sign-in page component extracted from the Kroolo frontend application.

## Components Included

1. **Signin.jsx** - Main sign-in page component
2. **Social Login Components**:
   - GoogleSignUp.jsx
   - MicrosoftSignUp.jsx
   - AppleSignUp.jsx
   - SlackSignUp.jsx
3. **Shared Components**:
   - shared/SignupSidePanel.jsx - Side panel with background images
   - commonComponents/TextInput.jsx - Custom text input component
4. **Utilities**:
   - TermsAndPrivacyLinks.jsx - Terms and privacy policy links
   - LoadingSpinner.jsx - Loading spinner component
   - store.js - Mock authentication store
   - services/httpClient.js - Mock HTTP client

## Dependencies

- React
- Material UI (@mui/material, @mui/styles)
- React Router DOM
- React Helmet
- Material UI Icons

## Usage

The Signin component is a complete login form with:
- Email and password inputs
- Social login buttons (Google, Microsoft, Apple, Slack)
- "Forgot password" functionality
- Sign up link
- Input validation
- Loading states

## Customization

To integrate this component into your project:
1. Install the required dependencies
2. Update API endpoints and authentication logic as needed
3. Adjust styling to match your design system
4. Configure social login providers according to your implementation

## Notes

- This is a frontend-only component and requires backend integration for actual authentication
- Social login providers need to be configured separately in your application
- Environment-specific URLs in TermsAndPrivacyLinks.jsx should be updated as needed