import { useNavigate } from "react-router-dom";
import StyleButton from "../components/StyleButton";
import Navbar from "../components/Navbar";


export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
    <Navbar/>
    <div
  className="flex flex-col items-center justify-center h-screen overflow-hidden pt-0 text-black font-[Kaisei_Decol] bg-[#F2EFE8] px-6 sm:px-10 text-center"
  style={{ fontFamily: "'Kaisei Decol', serif" }}
>
  <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold mb-4 tracking-tight">
    ModNet
  </h1>
  <p className="text-base sm:text-lg text-gray-700 max-w-xs sm:max-w-md leading-relaxed mb-8">
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
