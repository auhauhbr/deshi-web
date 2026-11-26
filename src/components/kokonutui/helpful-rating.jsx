/**
 * @author: @kokonutui
 * @description: Helpful Rating
 * @version: 1.0.0
 * @date: 2026-11-08
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { Check } from "lucide-react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const LEVELS = [
  { label: "Péssimo", color: "#f43f5e", mouth: -13, brow: 6, eye: 6 },
  { label: "Ruim", color: "#f97316", mouth: -6, brow: 3, eye: 6 },
  { label: "Regular", color: "#a1a1aa", mouth: 0, brow: 0, eye: 6 },
  { label: "Bom", color: "#0ea5e9", mouth: 9, brow: 0, eye: 5.5 },
  { label: "Ótimo", color: "#10b981", mouth: 17, brow: 0, eye: 3 },
];

const LOW_REASONS = [
  "Difícil de acompanhar",
  "Faltaram instruções",
  "Carga inadequada",
  "Tempo insuficiente",
];
const HIGH_REASONS = ["Instruções claras", "Exercícios adequados", "Bom ritmo"];

const EASE_OUT = [0.23, 1, 0.32, 1];
const FACE = {
  type: "spring",
  stiffness: 400,
  damping: 30
};
const SLIDE = {
  type: "spring",
  stiffness: 500,
  damping: 38
};
const MIDDLE = 2;

export default function HelpfulRating({
  question = "Como foi seu treino?",
  onSubmit,
  onSkip,
  className
}) {
  const uid = useId();
  const reduceMotion = useReducedMotion();
  const [rating, setRating] = useState(null);
  const [preview, setPreview] = useState(null);
  const [reasons, setReasons] = useState([]);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const buttons = useRef([]);
  const confirmation = useRef(null);
  const wasSent = useRef(false);

  useEffect(() => {
    if (sent) confirmation.current?.focus({ preventScroll: true });
    else if (wasSent.current) buttons.current[MIDDLE]?.focus({ preventScroll: true });
    wasSent.current = sent;
  }, [sent]);

  const shown = preview ?? rating ?? MIDDLE;
  // Once sent, the face smiles a thank-you in the color of the answer.
  const level = sent
    ? { ...LEVELS[4], color: LEVELS[shown].color }
    : LEVELS[shown];
  const low = rating !== null && rating < MIDDLE;
  const choices = low ? LOW_REASONS : HIGH_REASONS;

  const pick = (index) => {
    if (rating !== null && (index < MIDDLE) !== (rating < MIDDLE)) {
      setReasons([]);
    }
    setRating(index);
  };

  // Arrow keys move between answers like a radio group.
  const onKeyDown = (event, i) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[
      event.key
    ];
    if (step) {
      event.preventDefault();
      const next = (i + step + LEVELS.length) % LEVELS.length;
      buttons.current[next]?.focus();
      pick(next);
    }
  };

  const toggle = (reason) =>
    setReasons((all) =>
      all.includes(reason) ? all.filter((r) => r !== reason) : [...all, reason]
    );

  const reset = () => {
    setRating(null);
    setPreview(null);
    setReasons([]);
    setNote("");
    setSent(false);
    setError("");
  };

  const focusable = rating ?? MIDDLE;

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn(
          "w-full max-w-sm overflow-hidden motion-reduce:[&_*]:transition-none rounded-[24px] border border-zinc-200 bg-white p-5 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100",
          className
        )}
      >
        <div className="flex flex-col items-center text-center">
          <Face level={level} look={shown - MIDDLE} sent={sent} reduceMotion={reduceMotion} />
          <div className="relative mt-3 h-6 w-full">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.p
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                className="font-semibold text-[16px] tracking-tight"
                exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
                initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
                key={sent ? "sent" : "ask"}
                transition={{ duration: 0.22, ease: EASE_OUT }}
              >
                {sent ? <span role="status" tabIndex={-1} ref={confirmation}>Obrigado pela avaliação!</span> : question}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="relative mt-0.5 h-5 w-full text-[13px] text-zinc-500 dark:text-zinc-400">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                initial={{ opacity: 0, y: 4 }}
                key={sent ? "sent" : level.label}
                transition={{ duration: 0.15, ease: EASE_OUT }}
              >
                {sent ? "Salva neste dispositivo." : level.label}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {!sent && (
            <motion.div
              animate={{ height: "auto", opacity: 1 }}
              className="overflow-hidden"
              exit={{
                height: 0,
                opacity: 0,
                transition: reduceMotion ? { duration: 0 } : {
                  height: { duration: 0.3, ease: EASE_OUT },
                  opacity: { duration: 0.15 },
                },
              }}
              initial={{ height: 0, opacity: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.3, ease: EASE_OUT }}
            >
              <div
                aria-label={question}
                className="mt-4 grid grid-cols-5 gap-1.5"
                onPointerLeave={() => setPreview(null)}
                role="radiogroup"
              >
                {LEVELS.map((l, i) => {
                  const selected = rating === i;
                  return (
                    // biome-ignore lint/a11y/useSemanticElements: face buttons acting as a radio group, with arrow keys handled here
                    <button
                      aria-checked={selected}
                      aria-label={l.label}
                      className={cn(
                        "relative flex h-10 items-center justify-center rounded-xl bg-zinc-100 outline-hidden transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:bg-zinc-900",
                        selected
                          ? "text-white"
                          : "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 active:bg-zinc-300 dark:text-zinc-400 dark:active:bg-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      )}
                      key={l.label}
                      onBlur={() => setPreview(null)}
                      onClick={() => pick(i)}
                      onFocus={() => setPreview(i)}
                      onKeyDown={(event) => onKeyDown(event, i)}
                      onPointerEnter={(event) => {
                        if (event.pointerType === "mouse") {
                          setPreview(i);
                        }
                      }}
                      ref={(el) => {
                        buttons.current[i] = el;
                      }}
                      role="radio"
                      tabIndex={i === focusable ? 0 : -1}
                      type="button"
                    >
                      {/* One pill slides to the answer and takes its color. */}
                      {selected && (
                        <motion.span
                          aria-hidden="true"
                          className="absolute inset-0 rounded-xl"
                          layoutId={`${uid}-picked`}
                          style={{
                            backgroundColor: l.color,
                            transition: "background-color 200ms ease-out",
                          }}
                          transition={SLIDE}
                        />
                      )}
                      <MiniFace bend={l.mouth} />
                    </button>
                  );
                })}
              </div>

              <AnimatePresence initial={false}>
                {rating !== null && (
                  <motion.div
                    animate={{ height: "auto", opacity: 1 }}
                    className="overflow-hidden"
                    exit={{ height: 0, opacity: 0 }}
                    initial={{ height: 0, opacity: 0 }}
                    transition={reduceMotion ? { duration: 0 } : {
                      height: { duration: 0.3, ease: EASE_OUT },
                      opacity: { duration: 0.2, delay: 0.05 },
                    }}
                  >
                    <div className="relative h-9">
                      <AnimatePresence initial={false} mode="popLayout">
                        <motion.p
                          animate={{ opacity: 1, y: 0 }}
                          className="pt-4 text-[13px] text-zinc-500 dark:text-zinc-400"
                          exit={{ opacity: 0, y: -4 }}
                          initial={{ opacity: 0, y: 4 }}
                          key={low ? "low" : "high"}
                          transition={{ duration: 0.18, ease: EASE_OUT }}
                        >
                          {low ? "O que poderia melhorar?" : "O que ajudou mais?"}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                    <motion.div
                      animate="shown"
                      className="mt-2 flex min-h-[72px] flex-wrap content-start gap-1.5"
                      initial="hidden"
                      key={low ? "low" : "high"}
                      transition={{ staggerChildren: 0.035 }}
                    >
                      {choices.map((reason) => (
                        <Chip
                          key={reason}
                          on={reasons.includes(reason)}
                          onClick={() => toggle(reason)}
                          reason={reason}
                        />
                      ))}
                    </motion.div>
                    <textarea
                      aria-label="Comentário opcional"
                      className="mt-1 block h-20 w-full resize-none rounded-xl bg-zinc-100 px-3 py-2 text-[16px] outline-hidden placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-400/50 sm:text-[14px] dark:bg-zinc-900 dark:placeholder:text-zinc-500"
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Algo mais? (opcional)"
                      value={note}
                    />
                    <button
                      className="mt-3 h-10 w-full rounded-xl bg-zinc-900 font-medium text-[14px] text-white outline-hidden transition-colors duration-150 hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-400/50 active:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:active:bg-zinc-300 dark:hover:bg-zinc-200"
                      onClick={() => {
                        try {
                          onSubmit?.({ rating: rating + 1, reasons, note });
                          setError("");
                          setPreview(null);
                          setSent(true);
                        } catch {
                          setError("Não foi possível salvar a avaliação neste dispositivo.");
                        }
                      }}
                      type="button"
                    >
                      Salvar avaliação
                    </button>
                    {error && <p className="mt-2 text-sm text-[var(--color-error)]" role="alert">{error}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {!sent && onSkip && (
          <button type="button" onClick={onSkip} className="mx-auto mt-3 block text-[12.5px] text-zinc-500 underline-offset-4 hover:underline focus-visible:underline dark:text-zinc-400">
            Agora não
          </button>
        )}
        <AnimatePresence initial={false}>
          {sent && (
            <motion.button
              animate={{ opacity: 1 }}
              className="mx-auto mt-3 block text-[12.5px] text-zinc-500 underline-offset-4 outline-hidden hover:text-zinc-900 hover:underline focus-visible:underline dark:text-zinc-400 dark:hover:text-zinc-100"
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              initial={{ opacity: 0 }}
              onClick={reset}
              transition={{ duration: 0.2, delay: 0.3 }}
              type="button"
            >
              Alterar minha resposta
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

const CHIP = {
  hidden: { opacity: 0, y: 4, filter: "blur(2px)" },
  shown: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.22, ease: EASE_OUT },
  },
};

function Chip({
  reason,
  on,
  onClick
}) {
  return (
    <motion.button
      aria-pressed={on}
      className={cn(
        "flex h-8 items-center gap-1 rounded-full border px-3 text-[12.5px] outline-hidden transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-zinc-400/50",
        on
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
          : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
      )}
      layout
      onClick={onClick}
      style={{ borderRadius: 999 }}
      transition={{ layout: { type: "spring", stiffness: 500, damping: 40 } }}
      type="button"
      variants={CHIP}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {on && (
          <motion.span
            animate={{ opacity: 1, scale: 1 }}
            className="-ml-0.5 flex"
            exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.1 } }}
            initial={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
          >
            <Check aria-hidden="true" className="size-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
      <motion.span layout="position">{reason}</motion.span>
    </motion.button>
  );
}

const mouthPath = (bend) => `M33 64 Q50 ${64 + bend} 67 64`;
const browPath = (side, tilt) => {
  const outer = side === -1 ? 26 : 74;
  const inner = side === -1 ? 42 : 58;
  return `M${outer} ${30 + tilt * 0.4} L${inner} ${30 - tilt}`;
};

/**
 * One face that bends its mouth, brows and eyes toward the answer, and
 * glances and leans toward the one under the pointer.
 */
function Face({
  level,
  look,
  sent,
  reduceMotion
}) {
  const faceTransition = reduceMotion ? { duration: 0 } : FACE;
  return (
    <motion.div
      animate={sent && !reduceMotion ? { y: [0, -8, 0] } : { y: 0 }}
      className="size-20"
      transition={
        sent && !reduceMotion ? { duration: 0.45, times: [0, 0.4, 1], ease: EASE_OUT } : faceTransition
      }
    >
      <motion.svg
        animate={{ rotate: look * 3 }}
        aria-hidden="true"
        className="size-20"
        initial={false}
        transition={faceTransition}
        viewBox="0 0 100 100"
      >
        <circle
          cx={50}
          cy={50}
          r={47}
          style={{ fill: level.color, transition: reduceMotion ? "none" : "fill 200ms ease-out" }}
        />
        <motion.g animate={{ x: look * 2.5 }} initial={false} transition={faceTransition}>
          {([-1, 1]).map((side) => (
            <motion.path
              animate={{
                d: browPath(side, level.brow),
                opacity: level.brow ? 1 : 0,
              }}
              fill="none"
              initial={false}
              key={`brow${side}`}
              stroke="white"
              strokeLinecap="round"
              strokeWidth={4}
              transition={faceTransition}
            />
          ))}
          {[36, 64].map((cx) => (
            <motion.ellipse
              animate={{ ry: level.eye }}
              cx={cx}
              cy={44}
              fill="white"
              initial={false}
              key={cx}
              rx={5}
              transition={faceTransition}
            />
          ))}
          <motion.path
            animate={{ d: mouthPath(level.mouth) }}
            fill="none"
            initial={false}
            stroke="white"
            strokeLinecap="round"
            strokeWidth={5}
            transition={faceTransition}
          />
        </motion.g>
      </motion.svg>
    </motion.div>
  );
}

function MiniFace({
  bend
}) {
  return (
    <svg
      aria-hidden="true"
      className="relative size-6"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle cx={8.5} cy={9} fill="currentColor" r={1.8} />
      <circle cx={15.5} cy={9} fill="currentColor" r={1.8} />
      <path
        d={`M7 15 Q12 ${15 + bend * 0.35} 17 15`}
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={2.4}
      />
    </svg>
  );
}
