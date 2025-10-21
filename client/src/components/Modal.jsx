import React, { useState } from "react";
import styled from "styled-components";

const Modal = ({ PFPS = [], onClose, onConfirm, updating }) => {
  const [selectedPfp, setSelectedPfp] = useState(null);

  return (
    <StyledWrapper>
      <div className="card">
        <h2 className="title">Choose Profile Picture</h2>

        <div className="imageGrid">
          {PFPS.map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`pfp-${index}`}
              onClick={() => setSelectedPfp(url)}
              className={`pfp ${
                selectedPfp === url ? "selected" : ""
              }`}
            />
          ))}
        </div>

        <div className="buttonContainer">
          <button className="cancelButton" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`confirmButton ${
              !selectedPfp || updating ? "disabled" : ""
            }`}
            onClick={() => onConfirm(selectedPfp)}
            disabled={!selectedPfp || updating}
          >
            {updating ? "Updating..." : "Confirm"}
          </button>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .card {
    width: 90%;
    max-width: 350px;
    background-color: #111;
    border-radius: 16px;
    padding: 20px;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    border: 1px solid #333;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  }

  .title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 5px;
  }

  .imageGrid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    justify-items: center;
    width: 100%;
  }

  .pfp {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s ease-in-out;
  }

  .pfp:hover {
    transform: scale(1.05);
  }

  .pfp.selected {
    border: 2px solid #aaa;
    transform: scale(1.08);
  }

  .buttonContainer {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 10px;
  }

  .cancelButton,
  .confirmButton {
    border: none;
    border-radius: 8px;
    padding: 8px 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
  }

  .cancelButton {
    background-color: #333;
    color: #ddd;
  }

  .cancelButton:hover {
    background-color: #444;
  }

  .confirmButton {
    background-color: #eee;
    color: #111;
  }

  .confirmButton:hover {
    background-color: #fff;
  }

  .confirmButton.disabled {
    background-color: #666;
    color: #999;
    cursor: not-allowed;
  }
`;

export default Modal;
