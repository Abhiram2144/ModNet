import React, { useState, useRef } from 'react';
import styled from 'styled-components';

const CodeInput = ({ onSubmit, onClear, loading = false }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace to go to previous input
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      onSubmit(fullCode);
    }
  };

  const handleClear = (e) => {
    e.preventDefault();
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    if (onClear) onClear();
  };

  return (
    <StyledWrapper>
      <form className="form" onSubmit={handleVerify}>
        <div className="info">
          <span className="title">Admin Security Code</span>
          <p className="description">Enter your 6-digit security code to access the dashboard</p>
        </div>
        <div className="input-fields">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              maxLength={1}
              type="password"
              value={code[index]}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={loading}
              autoFocus={index === 0}
            />
          ))}
        </div>
        <div className="action-btns">
          <button type="submit" className="verify" disabled={loading || code.join('').length !== 6}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
          <button type="button" onClick={handleClear} className="clear" disabled={loading}>
            Clear
          </button>
        </div>
      </form>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .form {
    --primary-black: #000000;
    --gray-900: #111827;
    --gray-700: #374151;
    --gray-600: #4b5563;
    --gray-300: #d1d5db;
    --gray-100: #f3f4f6;
    --white: #ffffff;
    --blue-500: #3b82f6;
    --blue-600: #2563eb;
    --red-500: #ef4444;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 32px;
    display: flex;
    max-width: 450px;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
    color: var(--gray-900);
    background-color: var(--white);
    border-radius: 16px;
    position: relative;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid var(--gray-300);
  }

  /*----heading and description-----*/

  .info {
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--gray-900);
  }

  .description {
    margin-top: 8px;
    font-size: 0.875rem;
    color: var(--gray-600);
    line-height: 1.5;
  }

  /*----input-fields------*/

  .form .input-fields {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .form .input-fields input {
    height: 2em;
    width: 2em;
    outline: none;
    text-align: center;
    font-family: 'Inter', sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--gray-900);
    border-radius: 8px;
    border: 2px solid var(--gray-300);
    background-color: var(--white);
    transition: all 0.2s ease;
  }

  .form .input-fields input:focus {
    border: 2px solid var(--blue-500);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    transform: scale(1.05);
  }

  .form .input-fields input:disabled {
    background-color: var(--gray-100);
    cursor: not-allowed;
  }

  /*-----verify and clear buttons-----*/

  .action-btns {
    display: flex;
    margin-top: 24px;
    gap: 12px;
    width: 100%;
  }

  .verify {
    flex: 1;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    color: var(--white);
    background: var(--primary-black);
    border: none;
    transition: all 0.2s ease;
    user-select: none;
    cursor: pointer;
  }

  .verify:hover:not(:disabled) {
    background: var(--gray-900);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .verify:active:not(:disabled) {
    transform: translateY(0);
  }

  .clear {
    flex: 1;
    padding: 12px 24px;
    text-decoration: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    color: var(--gray-700);
    background: var(--white);
    border: 2px solid var(--gray-300);
    transition: all 0.2s ease;
    user-select: none;
    cursor: pointer;
  }

  .clear:hover:not(:disabled) {
    background: var(--gray-100);
    border-color: var(--gray-600);
  }

  .clear:active:not(:disabled) {
    transform: scale(0.98);
  }

  .verify:disabled,
  .clear:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }`;

export default CodeInput;
