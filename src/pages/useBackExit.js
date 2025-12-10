import { useEffect, useRef } from "react";

export default function useBackExit() {
  const lastPress = useRef(0);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Backspace" || e.key === "Escape") {
        const now = Date.now();

        if (now - lastPress.current < 2000) {
          // ✅ Allow exit
          window.history.back();
        } else {
          // ❌ Block exit (first press)
          e.preventDefault();
          lastPress.current = now;

          // show message
          alert("Press BACK again to exit");
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
