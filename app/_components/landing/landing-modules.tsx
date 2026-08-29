"use client";

import { useEffect, useRef, useState } from "react";
import IndexShader from "@/app/_components/landing/index-shader";
import RevealText from "@/app/_components/landing/reveal-text";
import SensorCube from "@/app/_components/landing/sensor-cube-scene";

const modules = [
  { name: "传感", type: "sensor" },
  { name: "风向", type: "wind" },
  { name: "环境", type: "environment" },
  { name: "姿态", type: "pose" },
] as const;

type Module = (typeof modules)[number];

export default function LandingModules() {
  const [activeModule, setActiveModule] = useState<Module>();
  const [moduleOpen, setModuleOpen] = useState(false);
  const moduleContent = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeModule) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModuleOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeModule]);

  useEffect(() => {
    if (!activeModule || moduleOpen) {
      return;
    }

    const timeout = window.setTimeout(
      () => setActiveModule(undefined),
      850,
    );

    return () => window.clearTimeout(timeout);
  }, [activeModule, moduleOpen]);

  useEffect(() => {
    moduleContent.current?.scrollTo(0, 0);
  }, [activeModule]);

  return (
    <>
      <section className="landing-index">
        {modules.map((item) => (
          <button
            className={`landing-index__row landing-index__row--${item.type}`}
            key={item.type}
            onClick={() => {
              setActiveModule(item);
              setModuleOpen(true);
            }}
            type="button"
          >
            <RevealText>{item.name}</RevealText>
            <span className="landing-index__visual" aria-hidden="true">
              {item.type === "sensor" ? (
                <SensorCube />
              ) : (
                <IndexShader mode={item.type} />
              )}
            </span>
            <span className="landing-index__arrow" aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <path d="M7 25 25 7M12 7h13v13" />
              </svg>
            </span>
          </button>
        ))}
      </section>
      <section
        className="landing-module-page"
        data-state={
          !activeModule ? "closed" : moduleOpen ? "open" : "closing"
        }
        data-native-scroll
        aria-hidden={!moduleOpen}
        onWheel={(event) => {
          if (
            moduleContent.current &&
            !moduleContent.current.contains(event.target as Node)
          ) {
            moduleContent.current.scrollTop += event.deltaY;
          }
        }}
        onTransitionEnd={(event) => {
          if (
            event.target === event.currentTarget &&
            event.propertyName === "transform" &&
            !moduleOpen
          ) {
            setActiveModule(undefined);
          }
        }}
      >
        <button
          className="landing-module-page__close"
          type="button"
          aria-label="关闭"
          onClick={() => setModuleOpen(false)}
        >
          <svg viewBox="0 0 32 32" aria-hidden="true">
            <path d="M7 7 25 25M25 7 7 25" />
          </svg>
        </button>
        <div className="landing-module-page__heading">
          <h2>{activeModule?.name}</h2>
        </div>
        <div
          className="landing-module-page__content"
          ref={moduleContent}
          tabIndex={moduleOpen ? 0 : -1}
        />
      </section>
    </>
  );
}
