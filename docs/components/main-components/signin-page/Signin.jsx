import { Grid } from "@mui/material";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import GoogleSignUp from "./GoogleSignUp";
import SignupSidePanel from "./shared/SignupSidePanel";
import Box from "@mui/material/Box";
import { makeStyles } from "@mui/styles";
import { useNavigate } from "react-router-dom";
import KrooloLogo from "./images/Logos/kroolo-dark-logo.svg?react";
import { useAuthenticationStore, mockActions } from "./store";
import TextInput from "./commonComponents/TextInput";
import TermsAndPrivacyLinks from "./TermsAndPrivacyLinks";
import { EMAIL_REGEX } from "./constants/validationConstants";
import ErrorMessage from "./constants/error-message.json";
import LoadingSpinner from "./LoadingSpinner";
import { Helmet } from "react-helmet";
import krooloHttpClient from "./services/httpClient";
import MicrosoftSignUp from "./MicrosoftSignUp";
import SlackSignUp from "./SlackSignUp";
import FEATURE_FLAGS from "./FEATURE_FLAGS";
import AppleSignUp from "./AppleSignUp";
import { InputAdornment, IconButton } from "@mui/material";
import { EditRounded, Visibility, VisibilityOff } from "@mui/icons-material";
import MicrosoftSocialLogin from "./MicrosoftSignUp";
import SlackSocialLogin from "./SlackSignUp";

const useStyles = makeStyles((theme) => ({
  root: {
    "& .MuiFormLabel-root": {
      color: "#98A2B3",

      fontStyle: "normal",
      fontWeight: 400,
      fontSize: "16px",
    },
    "& .MuiInputBase-root": {
      "& :after": {
        border: "1px solid #98A2B3",
      },
      "& :before": {
        border: "1px solid #98A2B3",
      },
    },
  },
}));

function Signin() {
  const classes = useStyles();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const redirectUrl = searchParams.get("redirectUrl");

  useEffect(() => {
    if (email) {
      // State management has been removed in this mock version
      // You would handle email updates using React useState or your preferred state management
    }
  }, [email]);

  let navigate = useNavigate();
  const [password, setPassword] = useState("");
  // Using React state instead of the authentication store
  const [signInData, setSignInData] = useState({ email: "" });
  const [signInError, setSignInError] = useState({ email: "", disabled: false, loader: false });
  const [signInContinueData, setSignInContinueData] = useState({ password: "" });
  const [signInContinueError, setSignInContinueError] = useState({ password: "", disabled: false, loader: false });
  const [forgotPasswordData, setForgotPasswordData] = useState({ email: "" });

  // Using mock actions instead of store actions
  const fetchSigninData = mockActions.fetchSigninData;
  const fetchSigninContinueData = mockActions.fetchSigninContinueData;
  const [country, setCountry] = useState();
  const [showPassword, setShowPassword] = React.useState(false);

  const onSubmit = (event) => {
    event.preventDefault();
    const isEmail = onEmailChange(signInData.email);
    if (
      isEmail &&
      onPasswordChange(signInContinueData.password) &&
      signInContinueData.password
    ) {
      setSignInError(prev => ({ ...prev, disabled: true, loader: true }));
      fetchSigninData({ ...signInData, userLocationData: country }, navigate, redirectUrl);
      fetchSigninContinueData(
        { email: signInData.email, password: signInContinueData.password },
        navigate,
        redirectUrl,
      );
    }
  };

  const onEmailChange = (value) => {
    setSignInData(prev => ({ ...prev, email: value?.toLowerCase() }));
    if (!value) {
      setSignInError(prev => ({ ...prev, email: ErrorMessage.email.required }));
      return false;
    } else if (!EMAIL_REGEX.test(value)) {
      setSignInError(prev => ({ ...prev, email: ErrorMessage.email.validate }));
      return false;
    } else {
      setForgotPasswordData(prev => ({ ...prev, email: value?.toLowerCase() }));
      setSignInError(prev => ({ ...prev, email: "" }));
      return true;
    }
  };

  const onPasswordChange = (value) => {
    setPassword(value);
    setSignInContinueData(prev => ({ ...prev, password: value }));
    if (!value) {
      setSignInContinueError(prev => ({
        ...prev,
        password: ErrorMessage.password.required,
      }));
      return false;
    } else {
      setSignInContinueError(prev => ({ ...prev, password: "" }));
      return true;
    }
  };

  const geoLoactionData = () => {
    krooloHttpClient
      .get("https://ipapi.co/json/")
      .then((response) => {
        setCountry(response.data);
      })
      .catch((error) => {});
  };
  useEffect(() => {
    geoLoactionData();
    return () => {
      setSignInData(prev => ({ ...prev, email: "" }));
      setSignInError(prev => ({ ...prev, email: "" }));
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Sign In with Kroolo</title>
        <meta
          name="description"
          content="Sign Up with Kroolo to enjoy all your productivity needs"
        />
      </Helmet>
      <Grid
        item
        container
        lg={12}
        sm={12}
        xs={12}
        sx={{
          alignItems: "center",
          color: "#9e9e9e",
          display: "flex",
          fontSize: "14px",
          fontStyle: "normal",
          height: "inherit",
          justifyContent: "space-around",
          letterSpacing: ".17px",
          lineHeight: "143%",
          textAlign: "center",
          width: "inherit",
          height: "100vh",
        }}
      >
        <Grid
          item
          container
          className="right"
          xs={12}
          sm={12}
          lg={7}
          xl={7}
          sx={{
            height: "100%",
            overflowY: "auto",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Grid
            item
            alignItems="center"
            justifyContent="center"
            sx={{ display: "flex", py: 2 }}
            className="signBOx"
            width="100%"
          >
            <Box
              // height={478}
              component="form"
              onSubmit={onSubmit}
              sx={{
                position: "relative",
                backgroundColor: "#FFFFFF",
                border: "1px solid #EAECF0",
                gap: "24px",
                borderRadius: "12px",
                p: { xs: "20px", sm: "32px" },
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
                width: { xs: "100vw", sm: "440px", md: "440px" },
                maxWidth: "100%",
              }}
            >
              <Grid item container>
                <Grid
                  item
                  height="48px"
                  sm={12}
                  lg={12}
                  md={12}
                  xs={12}
                  display="flex"
                  justifyContent="center"
                >
                  <Link to="/" className="tdunder">
                    <KrooloLogo alt="" height={32} width={200} />
                  </Link>
                </Grid>
                <Grid item sm={12} lg={12} md={12} xs={12}>
                  <Typography
                    variant="h5"
                    component="h5"
                    fontWeight={500}
                    fontSize={20}
                    className="header-text-color"
                  >
                    Sign in with
                  </Typography>
                </Grid>
              </Grid>

              <Grid
                item
                container
                sx={{ gap: "24px" }}
                sm={12}
                lg={12}
                md={12}
                xs={12}
                height={236}
              >
                <Grid
                  container
                  direction="row"
                  wrap="nowrap"
                  sm={12}
                  lg={12}
                  md={12}
                  xs={12}
                  height={24}
                  sx={{ width: "100%", gap: "16px" }}
                >
                  <Grid item xs={12}>
                    <GoogleSignUp buttonText="Sign in with Google" fullWidth />
                  </Grid>
                </Grid>
                <Grid
                  container
                  direction="row"
                  wrap="nowrap"
                  sm={12}
                  lg={12}
                  md={12}
                  xs={12}
                  height={40}
                  sx={{ width: "100%", gap: "16px" }}
                >
                  {FEATURE_FLAGS.SOCIAL_LOGIN_FLAGS.MICROSOFT && (
                    <Grid item xs={12}>
                      <MicrosoftSocialLogin
                        buttonText="Sign in with Microsoft"
                        provider="microsoft"
                        fullWidth
                      />
                    </Grid>
                  )}
                </Grid>
                {FEATURE_FLAGS.SOCIAL_LOGIN_FLAGS.APPLE && (
                  <Grid
                    container
                    direction="row"
                    wrap="nowrap"
                    sm={12}
                    lg={12}
                    md={12}
                    xs={12}
                    height={40}
                    sx={{ width: "100%", gap: "16px" }}
                  >
                    {FEATURE_FLAGS.SOCIAL_LOGIN_FLAGS.APPLE && (
                      <Grid item xs={12}>
                        <AppleSignUp buttonText="Sign in with Apple" fullWidth />
                      </Grid>
                    )}
                  </Grid>
                )}
                {/* {FEATURE_FLAGS.SOCIAL_LOGIN_FLAGS.SLACK && (
                  <Grid item xs={6}>
                    <SlackSocialLogin buttonText="Slack" provider="slack" fullWidth />
                  </Grid>
                )} */}
                <Grid className="hweOr" item sm={12} lg={12} md={12} xs={12}>
                  <Typography
                    variant="span"
                    className="right-panel-item horizontal-line text-gray-800"
                  >
                    {" "}
                    Or{" "}
                  </Typography>
                </Grid>
                <Grid
                  item
                  sm={12}
                  lg={12}
                  md={12}
                  xs={12}
                  className="onboard-light-theme"
                  sx={{ borderRadius: "8px !important" }}
                >
                  <TextInput
                    id="email"
                    autoFocus
                    // inputProps={{ autoComplete: "off" }}
                    className={classes.root}
                    label="Email"
                    type="text"
                    name="email"
                    placeholder="john@example.com"
                    value={signInData.email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    error={signInError.email ? true : false}
                    errorMessage={signInError.email}
                    sx={{
                      input: {
                        color: "#2D2F34 !important",
                        fontSize: 13,
                        fontWeight: "500 !important",
                        height: "32px !important",
                      },
                    }}
                    labelStyles={{ color: "#2D2F34 !important" }}
                  />
                </Grid>

                <Grid item sm={12} lg={12} md={12} xs={12}>
                  <TextInput
                    className={classes.root}
                    label="Password"
                    name="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            className="adornment-btn"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <Visibility /> : <VisibilityOff />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    error={signInContinueError.password ? true : false}
                    errorMessage={signInContinueError.password}
                    sx={{
                      fontSize: 14,
                      input: {
                        color: "#2D2F34 !important",
                        fontSize: 14,
                        height: "32px !important",
                      },
                    }}
                    labelStyles={{ color: "#2D2F34 !important" }}
                  />
                  <Typography className="forgot-pass inline-note" sx={{ marginTop: "12px" }}>
                    <span
                      className="tdunder"
                      onClick={() => {
                        if (EMAIL_REGEX.test(signInData.email)) {
                          navigate("/forgot-password");
                        } else {
                          setSignInError(prev => ({
                            ...prev,
                            email: ErrorMessage.email.required,
                          }));
                        }
                      }}
                    >
                      Forgot password?
                    </span>
                  </Typography>
                </Grid>

                <Grid item sm={12} lg={12} md={12} xs={12}>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={signInError.disabled}
                    sx={{
                      boxShadow: "none",
                      whiteSpace: "nowrap",
                      fontWeight: 500,
                      lineHeight: "20px",
                      background: "var(--btn-color-base)",
                      color: "#ffffff ",
                      gap: "6px",
                      padding: "0 12px",
                      fontSize: "14px",
                      textTransform: "capitalize",
                      display: "flex",
                      justifyContent: "center",
                      width: "100%",
                      textAlign: "center",
                      alignItems: "center",
                      borderRadius: "4px",
                      height: "35px",
                      fontFamily: "Inter",
                      border: "none",
                      overflow: "hidden",
                      ":-moz-placeholder": {
                        background: "var(--btn-color-base) !important",
                        border: "none!important",
                        color: "#ffffff ",
                      },
                      "&.Mui-disabled": {
                        background: "var(--btn-color-base) !important",
                        border: "none!important",
                        color: "#ffffff ",
                        opacity: 0.6,
                        pointerEvents: "none",
                      },
                      "&:hover": {
                        boxShadow: "none",
                        border: "none",
                        background: "var(--btn-color-hover)",
                      },
                    }}
                  >
                    <Typography
                      variant="span"
                      sx={{
                        position: "relative",
                        gap: "6px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        textTransform: "capitalize",
                        fontSize: "14px",
                      }}
                    >
                      {signInError.loader ? <LoadingSpinner /> : "Sign in"}
                    </Typography>
                  </Button>
                </Grid>
              </Grid>
              {FEATURE_FLAGS.SSO_FLAG.SSO && (
                <Typography variant="span" className="inline-note">
                  &nbsp;&nbsp;
                  <Link to="/login/sso" className="tdunder" sx={{}}>
                    Login with SSO
                  </Link>
                </Typography>
              )}

              <Typography variant="body2" fontSize={13} className="typo">
                Don't have an account?
                <Typography variant="span" className="inline-note">
                  &nbsp;&nbsp;
                  <Link to="/signup" className="tdunder" sx={{}}>
                    Sign up
                  </Link>
                </Typography>
              </Typography>
            </Box>
            <TermsAndPrivacyLinks />
          </Grid>
        </Grid>
        <Grid className="signLeft" item container sm={5}>
          <SignupSidePanel />
        </Grid>
      </Grid>
    </>
  );
}

export default Signin;
