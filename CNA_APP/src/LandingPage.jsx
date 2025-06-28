import React from "react";
import CloudLegs from "./assets/svg/cloudLegs.svg"
import NavBar from "./NavBar";
function LandingPage() {
    return (
        <div> 
            <header>
                <div>
                <NavBar />
                  <a href="#">careflow</a>
                  <nav>
                    <a href="#about">about us</a>
                    <a href="#resources">resources</a>
                  </nav>
                </div>
                <nav>
                  <a href="#login">log in </a>
                  <a href="#signup">get started</a>
                </nav>
            </header>

            
            <main>
                
                <div>
                  
                  <img src="cloud-mascot.svg" alt="Cloud mascot character" />
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
                    <a href="#signup">get started</a>
                    <a href="#login">or log in</a>
                  </div>
                </section>
            </main>
        </div> // or </React.Fragment>
    );
}
export default LandingPage;