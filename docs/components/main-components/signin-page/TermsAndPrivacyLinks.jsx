import { Typography } from "@mui/material";

export default function TermsAndPrivacyLinks() {
  return (
    <div className="notAccount">
      <Typography
        variant="caption"
        width={315}
        height={40}
        className="typo"
        sx={{
          fontSize: "12px !important",
        }}
      >
        By signing up, You agree to the Kroolo's{" "}
        <Typography variant="span" className="inline-note">
          <a
            href="https://kroolo.com/terms-of-use"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Service
          </a>
        </Typography>
        {" and "}
        <Typography variant="span" className="inline-note">
          <a
            href="https://kroolo.com/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
        </Typography>
        .
      </Typography>
    </div>
  );
}
