import { gsap } from "gsap";

type Motion = {
  kind: "page" | "results" | "status" | "location";
  key?: unknown;
};

// Controls remain visible and usable throughout every transition.
export function motion(node: HTMLElement, initial: Motion) {
  let options = initial;
  let media: gsap.MatchMedia | undefined;
  let generation = 0;
  const play = () => {
    const current = ++generation;
    media?.revert();
    queueMicrotask(() => {
      if (current !== generation || !node.isConnected) return;
      media = gsap.matchMedia();
      media.add(
        "(prefers-reduced-motion: no-preference)",
        () => {
          if (options.kind === "page") {
            const heading = node.querySelector(".page-heading h1");
            if (heading)
              gsap.fromTo(
                heading,
                { x: 8, opacity: 0.88 },
                {
                  x: 0,
                  opacity: 1,
                  duration: 0.24,
                  ease: "expo.out",
                  clearProps: "transform,opacity",
                },
              );
          } else if (options.kind === "results") {
            const rows = [...node.querySelectorAll(".room-row")].slice(0, 12);
            gsap.fromTo(
              rows.length ? rows : node,
              { y: 4, opacity: 0.84 },
              {
                y: 0,
                opacity: 1,
                duration: 0.22,
                stagger: rows.length ? { amount: 0.06 } : 0,
                ease: "expo.out",
                clearProps: "transform,opacity",
              },
            );
          } else {
            gsap.fromTo(
              node,
              { scale: 0.97, opacity: 0.8 },
              {
                scale: 1,
                opacity: 1,
                duration: options.kind === "status" ? 0.16 : 0.24,
                ease: "expo.out",
                clearProps: "transform,opacity",
              },
            );
          }
        },
        node,
      );
    });
  };
  if (options.kind !== "status") play();
  return {
    update(next: Motion) {
      if (next.kind === options.kind && next.key === options.key) return;
      options = next;
      play();
    },
    destroy() {
      generation++;
      media?.revert();
    },
  };
}
