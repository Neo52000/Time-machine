"use client";

import { useState } from "react";
import type { PhoneAppProps } from "../types";

/** Lampe de poche: the screen itself becomes the light. */
export function TorchApp(_props: PhoneAppProps) {
  const [on, setOn] = useState(true);
  return (
    <button
      type="button"
      className={`ph-torch${on ? " ph-torch-on" : ""}`}
      aria-pressed={on}
      onClick={() => setOn((v) => !v)}
      data-testid="torch"
    >
      {on ? "Touchez pour éteindre" : "Touchez pour allumer"}
    </button>
  );
}
