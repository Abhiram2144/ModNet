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
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-2">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 font-inter text-sm text-gray-900 flex flex-col gap-5 box-border rounded-xl shadow-lg">
        <div className="text-center font-bold text-lg text-gray-900">
          {title}
        </div>

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          {step === "email" ? (
            <>
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="font-medium text-gray-700">
                  University Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your @student.le.ac.uk email"
                  value={email}
                  onChange={onEmailChange}
                  required
                  className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                className="bg-primary text-white w-full p-3 rounded-lg font-medium transition hover:bg-primary/90"
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <label htmlFor="otp" className="font-medium text-gray-700">
                  Enter OTP
                </label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  placeholder="Enter your OTP"
                  value={otp}
                  onChange={onOtpChange}
                  required
                  className="w-full p-3 rounded-lg border border-gray-300 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                className="bg-primary text-white w-full p-3 rounded-lg font-medium transition hover:bg-primary/90"
                type="submit"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                type="button"
                onClick={onSwitch}
                className="text-primary text-sm bg-none border-none mt-1 hover:underline"
              >
                🔁 Resend OTP
              </button>
            </>
          )}
        </form>

        {message && (
          <p className="text-center text-xs text-gray-500">{message}</p>
        )}

        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition hover:bg-blue-400"
          onClick={() => navigate("/")}
        >
          🏠 Go to Home
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
