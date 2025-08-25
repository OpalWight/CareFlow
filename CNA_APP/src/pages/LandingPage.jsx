import React from "react";
import CloudLegs from "../assets/svg/cloudLegs.svg";
import Study4CNA from "../assets/svg/Study4CNA.svg";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import WhyCareFlow from "../assets/svg/whyCareFlow.svg";
import GetStartedButton from "../components/GetStartedButton";
import HorizontalLine from "../components/HorizontalLine";
import sun from "../assets/svg/sun.svg";
import rainbow from "../assets/svg/rainbowCloud.svg";
import bgCloud from "../assets/svg/btmCloud.svg";

import "../styles/LandingPage.css";

function LandingPage() {
  const navigate = useNavigate();
  return (
    <Layout 
      enableVerticalLinesToggle={true}
      verticalLinesDefaultVisible={true}
    >
      <main>
        <div className="mascotPitchContianer">
          <div className="cloudMascotContainer">
            <img src={CloudLegs} alt="Cloud mascot character" />
          </div>
          <div className="PitchContainer">
            <img src={Study4CNA}></img>
            <h1 id="landing-page-h1">study for your</h1>
            <p id="landing-page-p">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt.
            </p>
            <div className="authenticationBTNContainer">
              <GetStartedButton />
              <span
                className="smallLoginBtn"
                onClick={() => navigate("/login")}
              >
                Log In
              </span>
            </div>
          </div>
        </div>

        <HorizontalLine className="landing-page-horizontal-line" />
        <div>
          <img className="whyCareFlow" src={WhyCareFlow}></img>
        </div>
        <div className="pillContainer">
          <div className="pillGradBg"></div>
          <img src={sun} alt="sun" className="sunImage" />
          <img src={rainbow} alt="rainbow" className="rainbowImage" />
          <img src={bgCloud} alt="bottom cloud" className="bottomCloudImage" />
        </div>
      </main>
    </Layout>
  );
}
export default LandingPage;
