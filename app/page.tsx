import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import QuadrantExplorer from "@/app/_components/landing/quadrant-explorer";
import {
  decisionSteps,
  evidenceLegend,
  painChapters,
} from "@/app/_components/landing/landing-content";
import styles from "@/app/_components/landing/landing.module.css";

export const metadata: Metadata = {
  title: "常宁居｜贵州避暑房微气候调控",
  description:
    "让房子结合温度、湿度、风、降水与居住时相，判断此刻更适合开窗、除湿，还是开空调。",
};

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32">
      <path d="M7 25 25 7M12 7h13v13" />
    </svg>
  );
}

export default function HomePage() {
  return (
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
          <a href="#logic">逻辑</a>
          <a href="#dimensions">四维</a>
        </nav>
        <Link className={styles.headerCta} href="/room">
          <span>进入空间</span>
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
            让房子自己判断
            <br />
            该开窗、除湿，还是开空调。
          </p>
          <a className={styles.scrollCue} href="#problem">
            <span>向下理解问题</span>
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <section className={styles.problemIntro} id="problem">
        <p className={styles.problemLead}>问题从一扇窗开始。</p>
        <h2 className={styles.problemTitle}>
          <span>贵州最凉的时候，</span>
          <span>也最潮。</span>
        </h2>
        <div className={styles.problemCopy}>
          <p>
            凉，是贵州的优势。潮，是这份凉爽的代价。风能带来免费的冷量，也可能把水汽送进卧室。
          </p>
          <p>
            温度已经合适时，继续制冷不是答案；人在睡着时，让人反复切换设备也不是答案。
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
                </div>
                <div className={styles.metricBlock}>
                  <strong>{chapter.metric}</strong>
                  <span>{chapter.metricLabel}</span>
                </div>
                <p className={styles.chapterEvidence}>
                  <span>数据事实</span>
                  {chapter.evidence}
                </p>
              </div>
            </article>
          </div>
        ))}
      </section>

      <section className={styles.manifesto} aria-labelledby="conflict-title">
        <h2 id="conflict-title">
          <span>开窗，带来免费的冷量。</span>
          <span>也可能，把湿气灌进屋。</span>
          <span className={styles.manifestoTurn}>问题不是二选一。</span>
          <span>问题是下一小时，房间会变成什么样。</span>
        </h2>
        <p>
          一扇窗，同时改变温度与水汽。
          <br />
          它不是开关，而是一条需要被计算的边界。
        </p>
      </section>

      <section className={styles.decision} id="logic">
        <div className={styles.decisionIntro}>
          <h2>房子先算后果，再选动作。</h2>
          <p>
            把房间视为节点、门窗视为边；依据质量、能量与水汽守恒，推演候选动作带来的室内轨迹。
          </p>
          <p className={styles.decisionNote}>
            当前为白盒物理仿真与滚动优化主环，不代表整屋硬件已经完成部署。
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

      <section className={styles.dimensionsIntro} id="dimensions">
        <div className={styles.dimensionHeadline}>
          <h2>四个维度，完成一次判断。</h2>
        </div>
        <p className={styles.dimensionsCopy}>
          传感说明房子正在发生什么；风向说明外界会怎样改变它；环境说明这一季要守住什么；姿态说明这个时刻，对人而言什么才算合适。
        </p>
        <div className={styles.formula} aria-label="判断模型的四个输入">
          {["房间状态", "气象边界", "设备能力", "居住时相"].map((label) => (
            <div key={label}>
              <strong>{label}</strong>
            </div>
          ))}
        </div>
      </section>

      <QuadrantExplorer />

      <section className={styles.evidence} aria-labelledby="evidence-title">
        <div className={styles.evidenceHeading}>
          <h2 id="evidence-title">把已经做到的，与仍要验证的，清楚地分开。</h2>
        </div>
        <div className={styles.evidenceList}>
          {evidenceLegend.map((item) => (
            <article key={item.label}>
              <h3>{item.label}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

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
            让房子自己判断，
            <br />
            让人只负责生活。
          </h2>
          <p>常宁居不是再增加一个控制面板，而是减少一个需要被记住的系统。</p>
          <Link href="/room" className={styles.closingCta}>
            <span>进入空间</span>
            <ArrowIcon />
          </Link>
        </div>
      </footer>
    </main>
  );
}
