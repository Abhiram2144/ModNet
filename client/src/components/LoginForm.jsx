import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";

const LoginForm = ({
  title,
  email,
  otp,
  step,
  loading,
  message,
  onEmailChange,
  onOtpChange,
  onSubmit,
  onSwitch,
}) => {
  const navigate = useNavigate();

  return (
    <StyledWrapper>
      <div className="form-container">
        <div className="logo-container">{title}</div>

        <form className="form" onSubmit={onSubmit}>
          {step === "email" ? (
            <>
              <div className="form-group">
                <label htmlFor="email">University Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your @student.le.ac.uk email"
                  value={email}
                  onChange={onEmailChange}
                  required
                />
              </div>
              <button
                className="form-submit-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="otp">Enter OTP</label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  placeholder="Enter your OTP"
                  value={otp}
                  onChange={onOtpChange}
                  required
                />
              </div>
              <button
                className="form-submit-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                type="button"
                onClick={onSwitch}
                className="link resend-btn hover:cursor-pointer"
              >
                🔁 Resend OTP
              </button>
            </>
          )}
        </form>

        {message && <p className="signup-link">{message}</p>}

        <button className="home-btn" onClick={() => navigate("/")}>
          🏠 Go to Home
        </button>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f3f4f6;

  .form-container {
    width: 100%;
    max-width: 400px;
    background-color: #fff;
    padding: 32px 24px;
    font-size: 14px;
    font-family: inherit;
    color: #212121;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-sizing: border-box;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .logo-container {
    text-align: center;
    font-weight: 700;
    font-size: 18px;
    color: #111;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-group label {
    font-weight: 500;
    color: #333;
  }

  .form-group input {
    width: 100%;
    padding: 12px 14px;
    border-radius: 8px;
    border: 1px solid #ccc;
    font-size: 14px;
    box-sizing: border-box;
    outline: none;
  }

  .form-group input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  .form-submit-btn {
    background-color: #111;
    color: #fff;
    border: none;
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: 0.2s ease;
  }

  .form-submit-btn:hover {
    background-color: #222;
  }

  .resend-btn {
    text-align: center;
    color: #2563eb;
    font-size: 14px;
    background: none;
    border: none;
    margin-top: 4px;
  }

  .signup-link {
    text-align: center;
    font-size: 13px;
    color: #555;
  }

  .home-btn {
    background-color: #2563eb;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: 0.2s ease;
  }

  .home-btn:hover {
    background-color: #1e40af;
  }
`;

export default LoginForm;
