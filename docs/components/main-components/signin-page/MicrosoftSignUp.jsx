import React from "react";
import microsoftIcon from "./images/Microsoft_Logo.png";
import Button from "@mui/material/Button";

function MicrosoftSignUp(props) {
  const microsoftLogin = () => {
    // Mock Microsoft login functionality
    console.log("Microsoft login clicked");
    // In a real implementation, you would integrate with Microsoft's OAuth
    // This is where you would typically redirect to Microsoft's authentication
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => microsoftLogin()}
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
          src={microsoftIcon}
          alt="microsoft-icon"
          style={{ marginRight: "12.5px", height: "25px" }}
        />
        {props.buttonText}
      </Button>
    </>
  );
}

export default MicrosoftSignUp;
