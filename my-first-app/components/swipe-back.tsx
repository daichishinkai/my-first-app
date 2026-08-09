"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const EDGE_THRESHOLD_PX = 24;
const SWIPE_DISTANCE_PX = 60;
const MAX_VERTICAL_RATIO = 0.5;

export function SwipeBack() {
  const router = useRouter();

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;

    function handleTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      if (touch.clientX <= EDGE_THRESHOLD_PX) {
        startX = touch.clientX;
        startY = touch.clientY;
        tracking = true;
      } else {
        tracking = false;
      }
    }

    function handleTouchEnd(e: TouchEvent) {
      if (!tracking) return;
      tracking = false;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = Math.abs(touch.clientY - startY);

      if (dx > SWIPE_DISTANCE_PX && dy < dx * MAX_VERTICAL_RATIO) {
        router.back();
      }
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [router]);

  return null;
}
