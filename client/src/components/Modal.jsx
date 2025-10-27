import React, { useState } from "react";
import styled from "styled-components";

const Modal = ({ PFPS = [], onClose, onConfirm, updating }) => {
  const [selectedPfp, setSelectedPfp] = useState(null);

  return (
    <StyledWrapper>
      <div
        className="card"
        role="dialog"
        aria-modal="true"
        aria-label="Choose profile picture"
      >
        <div className="header">
          <h2 className="title">Choose Profile Picture</h2>
          <button
            className="closeBtn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="previewArea">
          {selectedPfp ? (
            <>
              <img
                src={selectedPfp}
                alt="Selected pfp"
                className="previewImg"
              />
              <div className="previewLabel">Selected</div>
            </>
          ) : (
            <div className="previewPlaceholder">Tap an avatar to select</div>
          )}
        </div>

        <div className="gridWrapper">
          <div className="imageGrid">
            {PFPS.map((url, index) => (
              <div
                key={index}
                className={`pfpWrap ${selectedPfp === url ? "selected" : ""}`}
                onClick={() => setSelectedPfp(url)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedPfp(url);
                }}
              >
                <img
                  src={url}
                  alt={`pfp-${index}`}
                  className="pfp"
                  loading="lazy"
                />
                <span className="check" aria-hidden>
                  ✓
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="buttonContainer">
          <button className="cancelButton" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`confirmButton ${!selectedPfp || updating ? "disabled" : ""}`}
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
    width: 92%;
    max-width: 420px;
    background-color: #0b0b0b;
    border-radius: 18px;
    padding: 18px 18px 12px 18px;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    border: 1px solid #333;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  }

  .header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .closeBtn {
    background: transparent;
    border: none;
    color: #ddd;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    padding: 6px;
    border-radius: 8px;
  }
  .closeBtn:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .title {
    font-size: 1.15rem;
    font-weight: 700;
    margin-bottom: 0;
    color: #fff;
  }

  .previewArea {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 0 8px;
    min-height: 72px;
  }

  .previewImg {
    width: 84px;
    height: 84px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.5);
  }

  .previewLabel {
    font-size: 12px;
    color: #aaa;
    margin-left: 10px;
  }

  .previewPlaceholder {
    color: #999;
    font-size: 13px;
  }

  .gridWrapper {
    width: 100%;
    max-height: 60vh; /* keep modal content from growing too tall */
    overflow-y: auto;
    padding-right: 6px; /* space for scrollbar */
  }

  .imageGrid {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* mobile: 2 columns */
    gap: 18px;
    justify-items: center;
    width: 100%;
    align-content: start;
    padding-bottom: 8px;
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

  /* Larger images on wider screens */
  @media (min-width: 640px) {
    .pfp {
      width: 140px;
      height: 140px;
    }
    .imageGrid {
      grid-template-columns: repeat(3, 1fr); /* >=640px: 3 columns */
    }
    .previewImg {
      width: 96px;
      height: 96px;
    }
  }

  @media (min-width: 1024px) {
    .pfp {
      width: 160px;
      height: 160px;
    }
    .card {
      max-width: 760px;
    }
  }

  /* Mobile: limit visible rows to ~5 rows and make rest scrollable */
  @media (max-width: 639px) {
    /* 5 rows * 80px + 4 gaps * 14px + small padding allowance */
    .gridWrapper {
      max-height: calc(5 * 80px + 4 * 14px + 32px); /* ~488px */
    }
  }

  /* wrapper to position selection badge */
  .pfpWrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    outline: none;
    border-radius: 50%;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease;
  }

  .pfpWrap:focus {
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.06);
  }

  .pfpWrap.selected .pfp {
    transform: scale(1.08);
    border-color: #f3f4f6; /* lighter ring */
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
  }

  .check {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #16a34a; /* green */
    color: white;
    display: none;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  }

  .pfpWrap.selected .check {
    display: flex;
  }

  @media (min-width: 1024px) {
    .pfp {
      width: 120px;
      height: 120px;
    }
  }

  .buttonContainer {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 12px;
    width: 100%;
    padding: 10px 2px 6px;
  }

  .cancelButton,
  .confirmButton {
    border: none;
    border-radius: 8px;
    padding: 10px 14px;
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

  /* Custom scrollbar so user sees they can scroll */
  .gridWrapper::-webkit-scrollbar {
    width: 10px;
  }
  .gridWrapper::-webkit-scrollbar-track {
    background: transparent;
  }
  .gridWrapper::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 8px;
  }
  .gridWrapper::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

export default Modal;
