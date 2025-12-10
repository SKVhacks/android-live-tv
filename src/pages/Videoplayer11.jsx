// import React, { useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import escape from "../sound/okie.m4a";

// export default function Videoplayer() {
//   const navigate = useNavigate();
//   const escRef = useRef(null);

//   useEffect(() => {
//     escRef.current = new Audio(escape);
//     escRef.current.preload = "auto";

//     const backHandler = (e) => {
//       if (e.repeat) return;

//       if (e.key === "Backspace" || e.key === "Escape") {
//         escRef.current.currentTime = 0;
//         escRef.current.play();
//         navigate("/",{ replace: true });
//       }
//     };

//     window.addEventListener("keydown", backHandler);

//     return () => {
//       window.removeEventListener("keydown", backHandler);
//     };
//   }, []);

//   return <h1>Videoplayer</h1>;
// }


import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import escape from "../sound/close.mp3";

let ytPlayer = null;

export default function Watch() {
  const { id } = useParams();
  const navigate = useNavigate();
    const escRef = useRef(null);
    const qualityIntervalRef = useRef(null);

  useEffect(() => {
    escRef.current = new Audio(escape);
    escRef.current.preload = "auto";
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => loadPlayer();
    if (window.YT && window.YT.Player) loadPlayer();

    // BACK BUTTON
    const backHandler = (e) => {
      if (e.key === "Backspace" || e.key === "Escape") {
        escRef.current.currentTime = 0;
        escRef.current.play();
        
        navigate("/");
      }
    };
    window.addEventListener("keydown", backHandler);

    // PLAY / PAUSE BUTTON
    const playPauseHandler = (e) => {
       const key = e.key || e.detail;
      if (!ytPlayer) return;

      // Enter, OK, Space = toggle play/pause
      if (e.key === "Enter" || e.key === " " || e.key === "MediaPlayPause") {
        const state = ytPlayer.getPlayerState();
const overlay = document.getElementById("pauseOverlay");
        if (state === window.YT.PlayerState.PLAYING) {
          ytPlayer.pauseVideo();
          overlay.classList.remove("hidden");
        } else {
          ytPlayer.playVideo();
          overlay.classList.add("hidden");
        }
      }
    };
    window.addEventListener("keydown", playPauseHandler);
window.addEventListener("dpad", playPauseHandler);
    // CLEAN-UP
    return () => {
      window.removeEventListener("keydown", backHandler);
      window.removeEventListener("keydown", playPauseHandler);
      window.removeEventListener("dpad", playPauseHandler && backHandler);
// ✅ STOP quality forcing
  if (qualityIntervalRef.current) {
    clearInterval(qualityIntervalRef.current);
    qualityIntervalRef.current = null;
  }
      if (ytPlayer) {
        ytPlayer.destroy();
        ytPlayer = null;
      }
    };
  }, [id, navigate]);

  const loadPlayer = () => {
    // if (ytPlayer) ytPlayer.destroy();
if (!document.getElementById("ytplayer")) return;

    ytPlayer = new window.YT.Player("ytplayer", {
      videoId: id,
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 1,
        controls: 0,
        modestbranding: 1,
        // iv_load_policy: 3,
        rel: 0,
        // showinfo: 0,
        fs: 0,
        playsinline: 1
      },
      events: {
        onReady: (e) => {
        //   e.target.mute();
          e.target.playVideo();
           document.getElementById("pauseOverlay")?.classList.add("hidden");
//           force1080p(e.target);
//           setTimeout(() => {
//   e.target.unMute();
// }, 1500);
        },


onStateChange: (e) => {
      // ✅ Only force quality AFTER playback starts
      if (e.data === window.YT.PlayerState.PLAYING) {
        force1080p(e.target);
      }
    }



// 
        
      }
    });

  };


// const force1080p = (player) => {
//   let attempts = 0;

//   const interval = setInterval(() => {
//     const qualities = player.getAvailableQualityLevels();
//     console.log("Available:", qualities);

//     if (qualities.includes("hd1080")) {
//       player.setPlaybackQuality("hd1080");
//       player.setPlaybackQualityRange?.("hd1080");

//       console.log("✅ Forced 1080p");

//       attempts++;
//       if (attempts > 6) clearInterval(interval);
//     }
//   }, 1500);
// };



const force1080p = (player) => {
  if (qualityIntervalRef.current) return; // ✅ prevent duplicates

  let attempts = 0;

  qualityIntervalRef.current = setInterval(() => {
    // ✅ player already destroyed
    if (!player || !ytPlayer) {
      clearInterval(qualityIntervalRef.current);
      qualityIntervalRef.current = null;
      return;
    }

    const qualities = player.getAvailableQualityLevels();
    console.log("Available:", qualities);

    if (qualities.includes("hd1080")) {
      player.setPlaybackQuality("hd1080");
      player.setPlaybackQualityRange?.("hd1080");
      console.log("✅ Forced 1080p");

      attempts++;
      if (attempts > 6) {
        clearInterval(qualityIntervalRef.current);
        qualityIntervalRef.current = null;
      }
    }
  }, 1500);
};








  return (
    <div className="w-screen h-screen bg-black relative">
      <div id="ytplayer" className="w-full h-full"></div>
      {/* Pause Overlay bg-black bg-opacity-40*/}
    <div
      id="pauseOverlay"
      className="
        hidden
        absolute inset-0 flex items-center justify-center
        text-white text-7xl
        
        transition-all duration-200
      "
    >
      ⏸
    </div>
    </div>
  );
}
