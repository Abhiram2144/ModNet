import React from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";

const Button = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <StyledWrapper>
      {user ? (
        <button
          className="button"
          onClick={() => {
            navigate("/home");
          }}
        >
          Home
          {/* <span className="button-span"> ─ it's free</span> */}
        </button>
      ) : (
        <button
          className="button"
          onClick={() => {
            navigate("/login");
          }}
        >
          Get started
          <span className="button-span"> ─ it's free</span>
        </button>
      )}
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .button {
    padding: 15px 20px;
    border: none;
    outline: none;
    background-color: #151515;
    color: #eee;
    border-radius: 7px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease-out;
  }

  .button:hover {
    transform: translateY(-3px);
  }

  .button-span {
    color: #aaa;
  }
`;

export default Button;
