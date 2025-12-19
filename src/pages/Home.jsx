
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ChannelList from "./ChannelList";
import links from "../data/links.json";
// import next from "../sound/change.wav";
// import okie1 from "../sound/okie.wav";

export default function Home() {
  const navigate = useNavigate();

  /* ---------------- REFS ---------------- */
  const cardRefs = useRef([]);
  // const moveSoundRef = useRef(null);
  // const okSoundRef = useRef(null);

  const holdTimerRef = useRef(null);
  const holdDirRef = useRef(null);

  /* ---------------- STATE ---------------- */
  const [index, setIndex] = useState(null);
  const [ytInfo, setYtInfo] = useState({
    title: "",
    channel: "",
    thumbnail: ""
  });


  /* ---------------- RESTORE INDEX ---------------- */
  useEffect(() => {
    const saved = Number(localStorage.getItem("lastFocusedIndex"));
    if (!Number.isNaN(saved) && saved >= 0 && saved < links.length) {
      setIndex(saved);
    } else {
      setIndex(0);
    }
  }, []);

  /* ---------------- SAVE INDEX ---------------- */
  useEffect(() => {
    if (index !== null) {
      localStorage.setItem("lastFocusedIndex", String(index));
    }
  }, [index]);

  /* ---------------- YOUTUBE INFO ---------------- */
  useEffect(() => {
    if (index === null) return;

    let cancelled = false;
    const videoId = links[index].id;

    const load = async () => {
      try {
        const res = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        const data = await res.json();

        const thumbs = [
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        ];

        let thumb = "";
        for (const t of thumbs) {
          const r = await fetch(t, { method: "HEAD" });
          if (r.ok) {
            thumb = t;
            break;
          }
        }

        if (!cancelled) {
          setYtInfo({
            title: data.title,
            channel: data.author_name,
            thumbnail: thumb
          });
        }
      } catch {}
    };

    load();
    return () => (cancelled = true);
  }, [index]);

  /* ---------------- SCROLL ---------------- */
  useEffect(() => {
    if (index === null) return;
    const el = cardRefs.current[index];
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest"
      });
    });
  }, [index]);

  /* ---------------- MOVE LOGIC ---------------- */
  const moveIndex = (dir) => {
    setIndex((prev) => {
      if (dir === "right" && prev < links.length - 1) {
        // playMoveSound();
        return prev + 1;
      }
      if (dir === "left" && prev > 0) {
        // playMoveSound();
        return prev - 1;
      }
      return prev;
    });
  };

  /* ---------------- KEY HANDLING (HOLD SUPPORT) ---------------- */
  useEffect(() => {
    if (index === null) return;

    const onKeyDown = (e) => {
      if (e.repeat) return;

      if (e.key === "Enter") {
        // playOkSound();
        navigate(`/video/${links[index].id}`);
        return;
      }

      if (e.key === "ArrowRight" && !holdTimerRef.current) {
        holdDirRef.current = "right";
        moveIndex("right");

        holdTimerRef.current = setInterval(() => {
          moveIndex("right");
        }, 200);
      }

      if (e.key === "ArrowLeft" && !holdTimerRef.current) {
        holdDirRef.current = "left";
        moveIndex("left");

        holdTimerRef.current = setInterval(() => {
          moveIndex("left");
        }, 200);
      }
    };

    const onKeyUp = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
        holdDirRef.current = null;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [index, navigate]);

  if (index === null) return null;

  /* ---------------- UI ---------------- */
  return (
    <div className="relative h-screen w-screen bg-black text-white">
      {ytInfo.thumbnail && (
        <img
          src={ytInfo.thumbnail}
          alt=""
          className="absolute h-screen w-screen object-cover"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-black/60 to-transparent" />

      <div className="absolute top-10 left-10">
        <p className="text-xs">{links[index].category}</p>
        <p className="text-7xl font-bold mt-1">{ytInfo.channel}</p>
        <p className="text-base mt-2">{ytInfo.title}</p>
      </div>

      <div className="absolute bottom-0 inset-x-0">
        <div className="flex gap-5 overflow-x-auto px-10 py-8 items-center
          [scrollbar-width:none] [-ms-overflow-style:none]">
          {links.map((item, i) => (
            <div key={i} ref={(el) => (cardRefs.current[i] = el)}>
              <ChannelList item={item} focuse={i === index} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
