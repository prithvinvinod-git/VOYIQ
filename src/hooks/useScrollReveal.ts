
"use client";

import { useEffect, useRef, useCallback } from "react";

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

/**
 * Attaches an IntersectionObserver to the returned ref.
 * When the element enters the viewport, it adds the "in-view" class,
 * triggering CSS scroll-reveal animations defined in globals.css.
 */
export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const {
    threshold = 0.12,
    rootMargin = "0px 0px -60px 0px",
    once = true,
  } = options;

  const ref = useRef<HTMLElement | null>(null);

  const setRef = useCallback((node: HTMLElement | null) => {
    ref.current = node;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove("in-view");
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return setRef;
}

/**
 * Observes multiple children of a container element.
 * Adds "in-view" staggered via CSS --stagger-delay or .stagger-children parent.
 */
export function useScrollRevealContainer(options: ScrollRevealOptions = {}) {
  const {
    threshold = 0.08,
    rootMargin = "0px 0px -40px 0px",
    once = true,
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);

  const setRef = useCallback((node: HTMLElement | null) => {
    containerRef.current = node;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const children = Array.from(
      container.querySelectorAll<HTMLElement>(".reveal")
    );

    if (children.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            entry.target.classList.remove("in-view");
          }
        });
      },
      { threshold, rootMargin }
    );

    children.forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return setRef;
}
