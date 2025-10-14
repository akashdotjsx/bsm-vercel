import React from "react";
import slackIcon from "./images/slack_new_logo.png";
import Button from "@mui/material/Button";

function SlackSignUp(props) {
  const slackLogin = () => {
    // Mock Slack login functionality
    console.log("Slack login clicked");
    // In a real implementation, you would integrate with Slack's OAuth
    // This is where you would typically redirect to Slack's authentication
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => slackLogin()}
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
          src={slackIcon}
          alt="slack-icon"
          style={{ marginRight: "12.5px", height: "25px" }}
        />
        {props.buttonText}
      </Button>
    </>
  );
}

export default SlackSignUp;
