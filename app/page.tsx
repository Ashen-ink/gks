import type { Metadata } from "next";
import { CentralIcon } from "@central-icons-react/all";
import Image from "next/image";
import Link from "next/link";
import QuadrantExplorer from "@/app/_components/landing/quadrant-explorer";
import SmoothScroll from "@/app/_components/landing/smooth-scroll";
import {
  decisionSteps,
  painChapters,
} from "@/app/_components/landing/landing-content";
import styles from "@/app/_components/landing/landing.module.css";

export const metadata: Metadata = {
  title: "常宁居｜贵州避暑房微气候调控",
  description:
    "根据房间温湿度、门窗状态和短时天气，判断何时开窗、除湿或开空调。",
};

function ArrowIcon() {
  return (
    <CentralIcon
      name="IconArrowUpRight"
      join="round"
      fill="outlined"
      radius="3"
      stroke="1.5"
      size={20}
    />
  );
}

function DownloadIcon() {
  return (
    <CentralIcon
      name="IconFileDownload"
      join="round"
      fill="outlined"
      radius="3"
      stroke="1.5"
      size={20}
    />
  );
}

export default function HomePage() {
  return (
    <SmoothScroll>
      <main className={styles.page} id="main-content">
      <a className={styles.skipLink} href="#problem">
        跳至正文
      </a>

      <header className={styles.masthead}>
        <a className={styles.wordmark} href="#top" aria-label="常宁居首页">
          常宁居
        </a>
        <nav aria-label="首页导航">
          <a href="#problem">问题</a>
          <a href="#logic">怎么判断</a>
          <a href="#dimensions">四项</a>
        </nav>
        <Link className={styles.headerCta} href="/room">
          <span>查看房间</span>
          <ArrowIcon />
        </Link>
      </header>

      <section className={styles.hero} id="top" aria-labelledby="hero-title">
        <div className={styles.heroMedia}>
          <Image
            src="/landing/guizhou-mist.webp"
            alt="贵州荔波层叠山峦被雾气覆盖"
            fill
            preload
            sizes="100vw"
            className={styles.coverImage}
          />
        </div>
        <div className={styles.heroVeil} aria-hidden="true" />
        <div className={styles.heroPrelude}>
          <span>贵州避暑房微气候调控系统</span>
        </div>
        <h1 className={styles.heroTitle} id="hero-title">
          <span className={styles.srOnly}>常宁居</span>
          <span className={styles.heroGlyphs} aria-hidden="true">
            <span>常</span>
            <span>宁</span>
            <span>居</span>
          </span>
        </h1>
        <div className={styles.heroBottom}>
          <p>
            开窗、除湿，还是开空调。
            <br />
            房子先看天气和室内，再做决定。
          </p>
          <a className={styles.scrollCue} href="#problem">
            <span>先看夏夜数据</span>
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <section className={styles.problemIntro} id="problem">
        <p className={styles.problemLead}>贵州九个市州的夏夜</p>
        <h2 className={styles.problemTitle}>
          <span>夜里已经够凉，</span>
          <span>空气还是很潮。</span>
        </h2>
        <div className={styles.problemCopy}>
          <p>
            安顺夏季夜间均温约 19.8°C。九个市州的夜间相对湿度都在
            83%—94%。这类房子的持续制冷需求很低，除湿出现得更频繁。
          </p>
          <p>
            窗外凉时，可以先开窗。雨快到了，或者外面更潮，窗就该关上。温度说明冷暖，降雨和含湿量说明开窗后的水汽负担。
          </p>
        </div>
      </section>

      <section className={styles.painSequence} aria-label="居住痛点">
        {painChapters.map((chapter) => (
          <div className={styles.chapterTrack} key={chapter.index}>
            <article className={styles.chapter}>
              <div className={styles.chapterMedia}>
                <Image
                  src={chapter.image}
                  alt={chapter.imageAlt}
                  fill
                  sizes="100vw"
                  className={styles.coverImage}
                  style={{ objectPosition: chapter.imagePosition }}
                />
              </div>
              <div className={styles.chapterTint} aria-hidden="true" />
              <div className={styles.chapterFrame}>
                <div className={styles.chapterStatement}>
                  <h2>
                    {chapter.title.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </h2>
                  <p>{chapter.body}</p>
                  <a
                    className={styles.chapterMore}
                    href="#logic"
                    aria-label={`查看更多：${chapter.title.join("")}`}
                  >
                    <span>查看更多</span>
                    <ArrowIcon />
                  </a>
                </div>
                <div className={styles.metricBlock}>
                  <strong>{chapter.metric}</strong>
                  <span>{chapter.metricLabel}</span>
                </div>
                <p className={styles.chapterEvidence}>
                  <span>数据口径</span>
                  {chapter.evidence}
                </p>
              </div>
            </article>
          </div>
        ))}
      </section>

      <section className={styles.manifesto} aria-labelledby="conflict-title">
        <h2 id="conflict-title">
          <span>一扇窗，昨晚带走热，</span>
          <span>今晚可能带进水汽。</span>
          <span className={styles.manifestoTurn}>门窗位置、风向和降雨预报，</span>
          <span>决定它此刻该开还是该关。</span>
        </h2>
        <p>
          模型按房间计算热和水汽怎样流动。每次执行一个动作，收到新数据后再算下一次。
        </p>
      </section>

      <section className={styles.decision} id="logic">
        <div className={styles.decisionIntro}>
          <h2>把开窗、除湿和空调放在一起算。</h2>
          <p>
            模型依据质量、能量和水汽守恒，分别预测几种动作之后，每个房间的温度和含湿量。
          </p>
          <p className={styles.decisionNote}>
            这里展示安顺基准户型的物理仿真。整屋硬件仍处在部署阶段。
          </p>
        </div>
        <ol className={styles.decisionSteps}>
          {decisionSteps.map((step) => (
            <li key={step.index}>
              <div className={styles.stepBody}>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <QuadrantExplorer />

      <footer className={styles.closing}>
        <div className={styles.closingMedia}>
          <Image
            src="/landing/cold-room.webp"
            alt="晨光落进安静的卧室"
            fill
            sizes="100vw"
            className={styles.coverImage}
          />
        </div>
        <div className={styles.closingTint} aria-hidden="true" />
        <div className={styles.closingContent}>
          <h2>
            遥控器，
            <br />
            可以留在抽屉里。
          </h2>
          <p>天气变化后，房子重算下一步。住户手动操作，自动控制立即暂停。</p>
          <div className={styles.closingActions}>
            <Link href="/room" className={styles.closingCta}>
              <span>查看房间模拟</span>
              <ArrowIcon />
            </Link>
            <a
              href="/whitepaper.pdf"
              className={styles.closingResource}
              download="常宁居技术白皮书.pdf"
            >
              <span>下载白皮书</span>
              <DownloadIcon />
            </a>
            <a
              href="/slides.pdf"
              className={styles.closingResource}
              download="常宁居-Slide.pdf"
            >
              <span>下载 Slide</span>
              <DownloadIcon />
            </a>
          </div>
        </div>
      </footer>
      </main>
    </SmoothScroll>
  );
}
