import { useNavigate } from "react-router-dom";
import StyleButton from "../components/StyleButton";
import Navbar from "../components/Navbar";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="font-inter flex h-screen flex-col items-center justify-center overflow-hidden bg-[#F2EFE8] px-6 pt-0 text-center text-black sm:px-10">
        <h1 className="mb-4 text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
          ModNet
        </h1>
        <p className="mb-8 max-w-xs text-base leading-relaxed text-gray-700 sm:max-w-md sm:text-lg">
          Join real-time discussion channels with classmates studying the same
          modules — exchange ideas, notes, and motivation.
        </p>

        <div>
          <StyleButton onclick={() => navigate("/login")} />
        </div>
      </div>
    </>
  );
}
