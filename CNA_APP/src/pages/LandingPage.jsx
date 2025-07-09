import React from "react";
import CloudLegs from "../assets/svg/cloudLegs.svg"
import Study4CNA from "../assets/svg/study4CNA.svg"
import Lines from "../components/lines";
import vert from "../assets/svg/vert.svg"
import Layout from "../components/Layout";
import "../styles/LandingPage.css";

function LandingPage() {
    return (
        <Layout>
            <div className="line-container">
                <div className="vert-line"></div>
            </div>
            <main> 
                <div>
                  
                  <img src={CloudLegs} alt="Cloud mascot character" />
                </div>

               
                <section>
                  <h1>
                    study for your</h1>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do 
                    eiusmod tempor incididunt.
                  </p>
                  <div>
                  </div>
                </section>
            </main>
        </Layout>
    );
}
export default LandingPage;