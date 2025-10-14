import React from "react";
import Socialicon from "./images/apple.png";
import Button from "@mui/material/Button";

export default function AppleSignUp(props) {
  const appleLogin = () => {
    // Mock Apple login functionality
    console.log("Apple login clicked");
    // In a real implementation, you would integrate with Apple's OAuth
    // This is where you would typically redirect to Apple's authentication
  };

  return (
    <Button
      type="button"
      onClick={() => appleLogin()}
      sx={{
        color: "#344054",
        borderRadius: "4px",
        boxShadow: "none",
        transition: "ease-in-out 0.35s all",
        height: "35px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
        width: "100%",
        border: "1px solid rgb( 0 0 0 / 0.1) !important",
        "&:hover": { backgroundColor: "rgb(0 0 0 / 0.05)", boxShadow: "none" },
      }}
    >
      <img
        src={Socialicon}
        alt="apple-icon"
        style={{ marginRight: "12.5px", height: "25px" }}
      />
      {props.buttonText}
    </Button>
  );
}
