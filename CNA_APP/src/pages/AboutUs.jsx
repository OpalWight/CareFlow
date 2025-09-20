import React from "react";
import Layout from "../components/Layout";
import "../styles/AboutUs.css";
import dottedFlower from "../assets/svg/dottedFlower.svg";

function AboutUs() {
    console.log("AboutUs component is rendering");
    return (
        <Layout>
            <div className="about-us-container">
                <img src={dottedFlower} alt="Decorative dotted flower" className="dotted-flower dotted-flower-top" />
                <h1 id="about-us-h1" className="about-us-title">About Us</h1>
                <p id="about-us-p" className="about-us-content">
                    The CareFlow team is currently made up of two direction-less undergraduates at UC Davis who know nothing about what they want to do, with a determination to create an academic tool for aspiring CNA's, and hopefully someday, MA's and EMT's. We seek to keep AI simply as a learning tool in the academic community, not as a handicap.
                </p>
                <img src={dottedFlower} alt="Decorative dotted flower" className="dotted-flower dotted-flower-bottom" />
            </div>
        </Layout>
    );
}
export default AboutUs;