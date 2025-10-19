import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

const Button = ({ modules }) => {
  const navigate = useNavigate();
  const limitedModules = modules.slice(0, 4);

  return (
    <StyledWrapper>
      <div className="main">
        <div className="up">
          {limitedModules[0] && (
            <button
              className="card1"
              onClick={() => navigate(`/chat/${limitedModules[0].id}`)}
            >
              <span className="module-name" title={limitedModules[0].name}>
                {limitedModules[0].name}
              </span>
            </button>
          )}
          {limitedModules[1] && (
            <button
              className="card2"
              onClick={() => navigate(`/chat/${limitedModules[1].id}`)}
            >
              <span className="module-name" title={limitedModules[1].name}>
                {limitedModules[1].name}
              </span>
            </button>
          )}
        </div>

        <div className="down">
          {limitedModules[2] && (
            <button
              className="card3"
              onClick={() => navigate(`/chat/${limitedModules[2].id}`)}
            >
              <span className="module-name" title={limitedModules[2].name}>
                {limitedModules[2].name}
              </span>
            </button>
          )}
          {limitedModules[3] && (
            <button
              className="card4"
              onClick={() => navigate(`/chat/${limitedModules[3].id}`)}
            >
              <span className="module-name" title={limitedModules[3].name}>
                {limitedModules[3].name}
              </span>
            </button>
          )}
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 150px);
  width: 100%;

  .main {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }

  .up, .down {
    display: flex;
    flex-direction: row;
    gap: 1em;
    justify-content: center;
  }

  .card1, .card2, .card3, .card4 {
    width: 180px;
    height: 180px;
    outline: none;
    border: none;
    background: white;
    box-shadow: rgba(50, 50, 93, 0.25) 0px 4px 8px -1px, 
                rgba(0, 0, 0, 0.3) 0px 2px 4px -1px;
    transition: 0.3s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    text-align: center;
    overflow: hidden;
    word-wrap: break-word;
  }

  .card1 { border-radius: 180px 10px 10px 10px; }
  .card2 { border-radius: 10px 180px 10px 10px; }
  .card3 { border-radius: 10px 10px 10px 180px; }
  .card4 { border-radius: 10px 10px 180px 10px; }

  .card1:hover, .card2:hover, .card3:hover, .card4:hover {
    cursor: pointer;
    scale: 1.05;
    background-color: #f6f2e8;
  }

  .module-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: #222;
    text-transform: none;
    line-height: 1.1;
    text-overflow: ellipsis;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    max-width: 100%;
    word-break: break-word;
  }

  /* 📱 Small screens */
  @media (max-width: 600px) {
    .card1, .card2, .card3, .card4 {
      width: 130px;
      height: 130px;
      padding: 6px;
    }

    .card1 { border-radius: 130px 10px 10px 10px; }
    .card2 { border-radius: 10px 130px 10px 10px; }
    .card3 { border-radius: 10px 10px 10px 130px; }
    .card4 { border-radius: 10px 10px 130px 10px; }

    .module-name {
      font-size: 0.8rem;
      -webkit-line-clamp: 3;
    }
  }

  /* 💻 Medium screens (laptops/desktops) */
  @media (min-width: 1024px) {
    .card1, .card2, .card3, .card4 {
      width: 200px;
      height: 200px;
    }

    .card1 { border-radius: 200px 10px 10px 10px; }
    .card2 { border-radius: 10px 200px 10px 10px; }
    .card3 { border-radius: 10px 10px 10px 200px; }
    .card4 { border-radius: 10px 10px 200px 10px; }
  }

  /* 🖥️ Ultra-wide monitors */
  @media (min-width: 1600px) {
    .card1, .card2, .card3, .card4 {
      width: 240px;
      height: 240px;
    }

    .card1 { border-radius: 240px 10px 10px 10px; }
    .card2 { border-radius: 10px 240px 10px 10px; }
    .card3 { border-radius: 10px 10px 10px 240px; }
    .card4 { border-radius: 10px 10px 240px 10px; }
  }
`;


export default Button;
