import React from "react";
import CloudLegs from "../assets/svg/cloudLegs.svg"
import NavBar from "../components/NavBar";
function LandingPage() {
    return (
        <div> 
            <header>
                <NavBar />
            </header>            
            <main> 
                <div>
                  
                  <img src={CloudLegs} alt="Cloud mascot character" />
                </div>

               
                <section>
                  <h1>
                    study for your
                    <span>CNA certification</span>
                  </h1>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do 
                    eiusmod tempor incididunt.
                  </p>
                  <div>
                  </div>
                </section>
            </main>
        </div> // or </React.Fragment>
    );
}
export default LandingPage;