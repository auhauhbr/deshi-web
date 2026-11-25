import { Link } from "react-router-dom";
/**
 * @author: @kokonut-labs
 * @description: Slide Text Button with animated vertical text transition
 * @version: 1.0.0
 * @date: 2025-11-02
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { cn } from "@/lib/utils";

export default function SlideTextButton({
  text = "Criar conta",
  hoverText,
  to = "/cadastro",
  className,
  variant = "default",
  animateIn = true,
  ...props
}) {
  const slideText = hoverText ?? text;
  const variantStyles =
    variant === "ghost"
      ? "border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-secondary)]"
      : "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] hover:bg-[var(--color-primary-hover)]";

  return (
    <Link
      className={cn(
        "group relative inline-flex min-h-12 items-center justify-center overflow-hidden rounded-[var(--radius-md)] px-6 font-semibold text-[.94rem] tracking-normal transition-[background-color,scale,opacity,translate] duration-[150ms,150ms,200ms,200ms] ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary-active)] focus-visible:outline-offset-3 active:scale-[.98] motion-reduce:active:scale-100 sm:min-w-52",
        // CSS entrance from @starting-style: no JS and no wrapper element.
        // Reduced motion keeps the fade and drops the slide.
        animateIn &&
          "starting:translate-x-2 starting:opacity-0 motion-reduce:starting:translate-x-0",
        variantStyles,
        className
      )}
      to={to}
      {...props}
    >
      {/* Both labels share one grid cell, so the wider one sets the width
          and both stay centred; the hover label waits one row below. */}
      <span className="grid justify-items-center transition-transform duration-200 ease-[cubic-bezier(0.77,0,0.175,1)] group-hover:-translate-y-full group-focus-visible:-translate-y-full motion-reduce:transition-none">
        <span className="col-start-1 row-start-1 flex items-center gap-2 opacity-100 transition-opacity duration-200 group-hover:opacity-0 group-focus-visible:opacity-0">
          <span className="font-medium">{text}</span>
        </span>
        <span
          aria-hidden="true"
          className="col-start-1 row-start-1 flex translate-y-full items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <span className="font-medium">{slideText}</span>
        </span>
      </span>
    </Link>
  );
}
