import SmoothScroll from "@/app/_components/landing/smooth-scroll";
import RevealText from "@/app/_components/landing/reveal-text";
import LandingModules from "@/app/_components/landing/landing-modules";

export default function HomePage() {
  return (
    <SmoothScroll>
      <main className="landing-page">
        <section className="landing-hero">
          <h1>
            <RevealText>常宁居</RevealText>
          </h1>
        </section>
        <LandingModules />
      </main>
    </SmoothScroll>
  );
}
