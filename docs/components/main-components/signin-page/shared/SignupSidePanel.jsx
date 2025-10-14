import React from "react";
import { useLocation } from "react-router-dom";
import SigninBackground from "../images/sign-in-background.svg";
import SignupBackground from "../images/sign-up-background.svg";
import G2RatingImg from "../images/onboarding-assets/G2_rating.svg?react";
import CertificateImg from "../images/onboarding-assets/certificate_list.svg?react";

export default function SignupSidePanel() {
  const { pathname } = useLocation();

  return (
    <>
      {pathname?.includes("verify-email") ? (
        <div className="w-full min-h-[100vh] flex items-center justify-center relative">
          <img
            src={SigninBackground}
            alt="Default Signin Background"
            className="object-cover w-full h-[100vh]"
          />
          <div className="w-full px-4 absolute bottom-4 flex flex-row justify-between">
            <G2RatingImg />
            <CertificateImg />
          </div>
        </div>
      ) : pathname?.includes("signup") || pathname?.includes("verify-otp") ? (
        <div className="w-full min-h-[100vh] flex flex-col items-center justify-center relative">
          <img
            src={SignupBackground}
            alt="Default Signup Background"
            className="object-cover w-full h-[100vh]"
          />
          <div className="w-full px-4 absolute bottom-4 flex flex-row justify-between">
            <G2RatingImg />
            <CertificateImg />
          </div>
        </div>
      ) : (
        <div className="w-full min-h-[100vh] flex items-center justify-center relative">
          <img
            src={SigninBackground}
            alt="Default Signin Background"
            className="object-cover w-full h-[100vh]"
          />
          <div className="w-full px-4 absolute bottom-4 flex flex-row justify-between">
            <G2RatingImg />
            <CertificateImg />
          </div>
        </div>
      )}
    </>
  );
}
