import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import escapeSound from "../sound/close.mp3";

export default function Videoplayer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const playerRef = useRef(null);
  const qualityIntervalRef = useRef(null);
  const escAudioRef = useRef(null);

  /* -------------------- LOAD YOUTUBE API -------------------- */
  useEffect(() => {
    escAudioRef.current = new Audio(escapeSound);
    escAudioRef.current.preload = "auto";

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => loadPlayer();

    if (window.YT && window.YT.Player) {
      loadPlayer();
    }

    return () => {
      exitPlayer();
    };
  }, [id]);

  /* -------------------- BACK / EXIT KEYS -------------------- */
  useEffect(() => {
    const handleBack = (e) => {
      const backKeys = [
        "Escape",
        "Backspace",
        "BrowserBack",
        "GoBack"
      ];

      if (backKeys.includes(e.key)) {
        e.preventDefault();
        escAudioRef.current?.play();
        exitPlayer();
      }

      // Play / Pause
      if (
        e.key === "Enter" ||
        e.key === " " ||
        e.key === "MediaPlayPause"
      ) {
        togglePlayPause();
      }
    };

    window.addEventListener("keydown", handleBack);
    return () => window.removeEventListener("keydown", handleBack);
  }, []);

  /* -------------------- LOAD PLAYER -------------------- */
  const loadPlayer = () => {
    if (!document.getElementById("ytplayer")) return;

    if (playerRef.current) {
      playerRef.current.stopVideo();
      playerRef.current.destroy();
      playerRef.current = null;
    }

    playerRef.current = new window.YT.Player("ytplayer", {
      videoId: id,
      width: "100%",
      height: "100%",
      playerVars: {
        autoplay: 1,
        controls: 0,
        rel: 0,
        fs: 0,
        playsinline: 1
      },
      events: {
        onReady: (e) => {
          e.target.playVideo();
          document
            .getElementById("pauseOverlay")
            ?.classList.add("hidden");
        },

        onStateChange: (e) => {
          if (e.data === window.YT.PlayerState.PLAYING) {
            force1080p(e.target);
          }
        }
      }
    });
  };

  /* -------------------- FORCE 1080P -------------------- */
  const force1080p = (player) => {
    if (qualityIntervalRef.current) return;

    let attempts = 0;

    qualityIntervalRef.current = setInterval(() => {
      if (!playerRef.current) {
        clearInterval(qualityIntervalRef.current);
        qualityIntervalRef.current = null;
        return;
      }

      const qualities = player.getAvailableQualityLevels();
      console.log("Available:", qualities);

      if (qualities.includes("hd1080")) {
        player.setPlaybackQuality("hd1080");
        player.setPlaybackQualityRange?.("hd1080");
      }

      attempts++;
      if (attempts > 6) {
        clearInterval(qualityIntervalRef.current);
        qualityIntervalRef.current = null;
      }
    }, 1500);
  };

  /* -------------------- PLAY / PAUSE -------------------- */
  const togglePlayPause = () => {
    if (!playerRef.current) return;

    const state = playerRef.current.getPlayerState();
    const overlay = document.getElementById("pauseOverlay");

    if (state === window.YT.PlayerState.PLAYING) {
      playerRef.current.pauseVideo();
      overlay?.classList.remove("hidden");
    } else {
      playerRef.current.playVideo();
      overlay?.classList.add("hidden");
    }
  };

  /* -------------------- EXIT PLAYER -------------------- */
  const exitPlayer = () => {
    if (qualityIntervalRef.current) {
      clearInterval(qualityIntervalRef.current);
      qualityIntervalRef.current = null;
    }

    if (playerRef.current) {
      playerRef.current.stopVideo();
      playerRef.current.destroy();
      playerRef.current = null;
    }

    navigate(-1);
  };

  /* -------------------- UI -------------------- */
  return (
    <div className="w-screen h-screen bg-black relative">
      <div id="ytplayer" className="w-full h-full"></div>

      {/* Pause Overlay */}
      <div
        id="pauseOverlay"
        className="
          hidden
          absolute inset-0
          flex items-center justify-center
          text-white text-7xl
          bg-black/40
        "
      >
        ⏸
      </div>
    </div>
  );
}
