import { useEffect } from "react";
import load from "/assets/logo/abc.jpg";

export default function LoadingScreen() {
 
  return (
    <div className="w-screen h-screen bg-black flex flex-col justify-center items-center relative">

      {/* Center Logo */}
      <img
        src={load}
        alt="App Logo"
        className="w-100 h-100 object-contain  animate-fadeIn"
      />

      {/* Bottom Text */}
      <div className="absolute bottom-6 w-full text-center">
        <p className="text-gray-400 text-lg tracking-wide">
          Designed by <span className="text-pink-500 font-medium">Gadget_Vishwa</span>
        </p>
      </div>

    </div>
  );
}
