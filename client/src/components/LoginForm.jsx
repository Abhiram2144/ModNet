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
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-2">
      <div className="font-inter box-border flex w-full max-w-md flex-col gap-5 rounded-xl bg-white p-6 text-sm text-gray-900 shadow-lg sm:p-8">
        <div className="text-center text-lg font-bold text-gray-900">
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
                  className="focus:border-primary focus:ring-primary/20 w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:ring-2"
                />
              </div>
              <button
                className="bg-primary hover:bg-primary/90 w-full rounded-lg p-3 font-medium text-white transition"
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
                  className="focus:border-primary focus:ring-primary/20 w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:ring-2"
                />
              </div>
              <button
                className="bg-primary hover:bg-primary/90 w-full rounded-lg p-3 font-medium text-white transition"
                type="submit"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                type="button"
                onClick={onSwitch}
                className="text-primary mt-1 border-none bg-none text-sm hover:underline"
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
          className="rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition hover:bg-blue-400"
          onClick={() => navigate("/")}
        >
          🏠 Go to Home
        </button>
      </div>
    </div>
  );
};

export default LoginForm;
