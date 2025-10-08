import React from "react";
import {
  Grid,
  InputAdornment,
  InputLabel,
  Stack,
  TextField,
  Typography,
  styled,
} from "@mui/material";
import ErrorIcon from "../../images/svg-icons/input-error-icon.svg?react";
import { CheckCircleOutlineRounded } from "@mui/icons-material";

export const CustomTextfield = styled((props) => (
  <TextField {...props} variant="standard" fullWidth autoComplete="off" />
))({
  "& .MuiInput-root": {
    padding: "0px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent",
    borderRadius: "6px !important",
    fontSize: "13px !important",
    "&:hover, &:focus, &.Mui-focused": {
      borderColor: "var(--btn-color-base) !important",
      // backgroundColor: "var(--black-1000)",
      overflow: "hidden",
      fontFamily: "Inter",
    },
    "&.Mui-disabled": {
      backgroundColor: "transparent",
      color: "var(--text-input-disabled-color) !important",
      borderColor: "transparent",
    },
    "&.Mui-error, &:has(input:invalid)": {
      borderColor: "#FDA29B !important",
    },
    "&.Mui-focused": {
      "& input": { pointerEvents: "auto" },
    },
  },
  "& input": {
    pointerEvents: "none",
    borderRadius: "6px !important",
    padding: "4px 12px",
    textOverflow: "ellipsis",
    color: "var(--text-color)",
    fontWeight: 400,
    fontSize: "13px",
    lineHeight: "20px",
    fontFamily: "Inter",
    height: "28px",
    boxSizing: "border-box",
    "&::placeholder": {
      // color: "var(--text-input-placeholder-color)",
      color: "#ACB1B9",
      opacity: 1,
    },
    "&.Mui-disabled": {
      // Common.css - line:1238
      // -webkit-text-fill-color: var(--text-input-disabled-color);
      // webkitTextFillColor: "var(--text-input-disabled-color)",
      color: "var(--text-input-disabled-color) !important",
      cursor: "not-allowed !important",
    },
  },
  "& textarea": {
    padding: "4px 12px",
    textOverflow: "ellipsis",
    color: "var(--text-color)",
    fontWeight: "400 !important",
    fontSize: "13px !important",
    lineHeight: "20px",
    fontFamily: "Inter",
    "&::placeholder": {
      // color: "var(--text-input-placeholder-color)",
      color: "#ACB1B9",
      opacity: 1,
    },
    "&.Mui-disabled": {
      // Common.css - line:1238
      // -webkit-text-fill-color: var(--text-input-disabled-color);
      color: "var(--text-input-disabled-color) !important",
      cursor: "not-allowed !important",
    },
  },
  "&::-webkit-scrollbar-thumb, &::-webkit-scrollbar-track": {
    visibility: "hidden",
  },
  "&::-webkit-scrollbar:hover": {
    width: "5px",
  },

  "&::-webkit-scrollbar-thumb:hover": {
    visibility: "visible",
  },
  "& .MuiFormHelperText-root": {
    position: "static !important",
    marginTop: "6px !important",
    fontWeight: 400,
    fontSize: "12px !important",
    lineHeight: "18px !important",
    color: "#F04438",
  },
});

export default function TextInput({
  label,
  midText,
  maxLength = 200,
  errorMessage,
  labelStyles,
  InputProps,
  inputProps,
  fromSprint,
  fromSprintCreate,

  ...props
}) {
  // label = String
  // name = String
  // value = String {*not to be provided in case of special render components}
  // maxLength = Number
  // disabled = Boolean
  // error = Boolean
  // errorMessage = String
  // onChange = {changeHandler}

  return (
    <Stack
      direction="column"
      width="100%"
      justifyContent="start"
      gap={!fromSprint && "6px"}
      paddingTop={fromSprint && "3px"}
      sx={{ pointerEvents: props?.disabled ? "none" : "auto" }}
    >
      {label && (
        <Grid container>
          <InputLabel
            sx={{
              fontWeight: "var(--fw-normal) !important",
              fontSize: "12px !important",
              lineHeight: 1.2,
              color: "var(--text-input-label-color) !important",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "Inter",
              width: "100%",
              ...labelStyles,
            }}
          >
            {label}
          </InputLabel>
        </Grid>
      )}
      {midText && (
        <Grid container>
          <Typography
            fontWeight={400}
            fontSize="12px"
            lineHeight="16px"
            color="var(--workspacetext-subheader)"
          >
            {midText}
          </Typography>
        </Grid>
      )}
      <Grid container paddingBottom={fromSprintCreate && "3px"}>
        <CustomTextfield
          className="font-family"
          style={{}}
          inputProps={{
            maxLength: maxLength,
            spellCheck: false,
            ...inputProps,
          }}
          InputProps={{
            disableUnderline: true,
            ...InputProps,
            endAdornment:
              InputProps?.endAdornment ??
              (props?.error ? (
                <InputAdornment position="end">
                  <ErrorIcon
                    style={{ width: 16, height: 16, marginRight: 8 }}
                    draggable={false}
                  />
                </InputAdornment>
              ) : props?.successIcon ? (
                <InputAdornment position="end">
                  <CheckCircleOutlineRounded
                    style={{ width: 16, height: 16, marginRight: 12, color: "#079455" }}
                    draggable={false}
                  />
                </InputAdornment>
              ) : null),
          }}
          helperText={props?.error || props?.helper ? errorMessage : ""}
          {...props}
        />
      </Grid>
    </Stack>
  );
}
