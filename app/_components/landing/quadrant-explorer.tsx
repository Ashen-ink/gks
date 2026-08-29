"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import styles from "./quadrant-explorer.module.css";

type QuadrantKey = "sensor" | "wind" | "environment" | "pose";

type Quadrant = {
  key: QuadrantKey;
  index: string;
  name: string;
  englishName: string;
  eyebrow: string;
  statement: string;
  detail: string;
  points: Array<{
    title: string;
    description: string;
  }>;
  current: string;
  caveat: string;
};

const quadrants: Quadrant[] = [
  {
    key: "sensor",
    index: "01",
    name: "传感",
    englishName: "SENSE",
    eyebrow: "房间状态",
    statement: "先让房子看见自己的状态。",
    detail:
      "整套住宅不是一个温度值。每个房间的温湿度、门窗状态、占用情况与窗边风况，共同构成可计算的居住现场。",
    points: [
      {
        title: "房间级状态",
        description:
          "持续观察各空间的温度、相对湿度与门窗状态，保留卧室、客厅之间真实存在的差异。",
      },
      {
        title: "窗口边界",
        description:
          "同时比较室内外条件与窗口风况，不把“开窗”预设为恒定收益。",
      },
      {
        title: "非侵入占用",
        description:
          "只判断空间是否正在被使用，让舒适目标跟随生活，而不是建立个人身份画像。",
      },
    ],
    current:
      "以温湿度、门窗与占用状态作为基础输入；关键传感缺失时，系统回退到更保守的策略。",
    caveat:
      "占用感知用于改变房间目标，不等同于人物识别、行为分析或居住监控。",
  },
  {
    key: "wind",
    index: "02",
    name: "风向",
    englishName: "AIRFLOW",
    eyebrow: "气流拓扑",
    statement: "把风从天气现象，变成可调用的免费冷源。",
    detail:
      "自然通风的价值不只取决于室外是否凉爽，还取决于风从哪里进入、如何穿过房间，以及它同时带来了多少水汽。",
    points: [
      {
        title: "预报前置",
        description:
          "把短时天气预报放进决策，让房子为即将发生的升温、降雨或风向变化提前准备。",
      },
      {
        title: "多区连通",
        description:
          "根据门窗关系和房间连接方式寻找有效路径，而不是假设打开任意一扇窗都能形成穿堂风。",
      },
      {
        title: "驱动力判断",
        description:
          "综合风压与热浮力估计通风潜力，再决定这阵风是否值得被引入室内。",
      },
    ],
    current:
      "核心判断来自物理模型与滚动优化：先预测，再在每个决策周期重新校正。",
    caveat:
      "强风、降雨与室外高含湿量会压低开窗优先级；窗户在不同配置中可能是建议动作，而非自动执行。",
  },
  {
    key: "environment",
    index: "03",
    name: "环境",
    englishName: "CLIMATE",
    eyebrow: "温湿边界",
    statement: "在贵州，温度够低，不代表环境已经舒适。",
    detail:
      "系统同时计算温度与水汽：既利用凉爽室外空气，也避免在潮湿夜间或降雨时，把新的湿负荷带进房间。",
    points: [
      {
        title: "温湿同算",
        description:
          "内部优化以空气含湿量描述水汽状态，界面仍使用更容易理解的相对湿度呈现结果。",
      },
      {
        title: "天气边界",
        description:
          "降雨、太阳辐射与昼夜变化共同参与判断，避免只看一个室外温度就决定通风。",
      },
      {
        title: "全年三态",
        description:
          "避暑季、冬季与长期空置分别采用不同目标：纳凉、防冷风，以及无人时的防潮防霉。",
      },
    ],
    current:
      "避暑季优先利用自然冷源，并把独立除湿视为与制冷不同的问题；全年策略随季节和占用切换。",
    caveat:
      "“凉”与“干爽”是两个目标。潮湿夜晚即使温度宜人，也不应被简单判断为适合持续开窗。",
  },
  {
    key: "pose",
    index: "04",
    name: "姿态",
    englishName: "OCCUPANCY",
    eyebrow: "居住节律",
    statement: "同一间房，在入睡、离家和手动接管时，不应追逐同一个目标。",
    detail:
      "“姿态”描述人与房子的关系：有人还是无人、清醒还是入睡、短暂离开还是长期空置，以及居住者是否正在主动操作。",
    points: [
      {
        title: "情境目标",
        description:
          "根据在室、睡眠与离家状态调整舒适边界，减少无意义的设备运行与不合时宜的提醒。",
      },
      {
        title: "长期空置",
        description:
          "当住宅数月无人使用，目标从即时体感转向稳定湿度、降低霉变风险并保持低干预运行。",
      },
      {
        title: "人工优先",
        description:
          "任何手动操作都被视为明确意图；系统退后观察，并在合适时机恢复辅助，而不是争夺控制权。",
      },
    ],
    current:
      "规则与先验偏好共同调整舒适目标；个体偏好学习仍是路线图，不替代住宅的物理约束。",
    caveat:
      "这里的“姿态”不是摄像识别。常宁居追求的最终状态，是居住者不必意识到系统正在工作。",
  },
];

function QuadrantVisual({ type }: { type: QuadrantKey }) {
  return (
    <span className={styles.visual} data-visual={type} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

export default function QuadrantExplorer() {
  const [activeKey, setActiveKey] = useState<QuadrantKey | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const dialogId = useId();

  const activeQuadrant = useMemo(
    () => quadrants.find((quadrant) => quadrant.key === activeKey) ?? quadrants[0],
    [activeKey],
  );

  const closeDialog = useCallback(() => {
    setActiveKey(null);
  }, []);

  useEffect(() => {
    if (!activeKey) {
      return;
    }

    const dialog = dialogRef.current;
    const opener = openerRef.current;

    if (!dialog) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    if (!dialog.open) {
      dialog.showModal();
    }

    const focusFrame = window.requestAnimationFrame(() => {
      dialog.scrollTop = 0;
      closeButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      if (dialog.open) {
        dialog.close();
      }
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.paddingRight = previousBodyPaddingRight;

      window.requestAnimationFrame(() => {
        opener?.focus();
      });
    };
  }, [activeKey]);

  return (
    <section className={styles.explorer} aria-labelledby="quadrant-title">
      <div className={styles.intro}>
        <p className={styles.kicker}>06 / FOUR INPUTS</p>
        <div className={styles.introCopy}>
          <h2 id="quadrant-title">四个维度，串成一条判断链。</h2>
          <p>
            传感建立事实，风向判断路径，环境确认边界，姿态定义目标。四者在同一决策周期内互相约束，最终回答“此刻最少需要做什么”，而不是简单决定“该开哪台设备”。
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        {quadrants.map((quadrant) => (
          <article className={styles.card} data-tone={quadrant.key} key={quadrant.key}>
            <button
              className={styles.cardButton}
              type="button"
              aria-haspopup="dialog"
              aria-controls={dialogId}
              aria-label={`展开${quadrant.name}维度：${quadrant.statement}`}
              onClick={(event) => {
                openerRef.current = event.currentTarget;
                setActiveKey(quadrant.key);
              }}
            >
              <span className={styles.cardMeta}>
                <span>{quadrant.index}</span>
                <span>{quadrant.englishName}</span>
              </span>
              <QuadrantVisual type={quadrant.key} />
              <span className={styles.cardCopy}>
                <span className={styles.cardEyebrow}>{quadrant.eyebrow}</span>
                <span className={styles.cardName}>{quadrant.name}</span>
                <span className={styles.cardStatement}>{quadrant.statement}</span>
              </span>
              <span className={styles.cardAction} aria-hidden="true">
                <span>展开逻辑</span>
                <svg viewBox="0 0 28 28">
                  <path d="M5 23 23 5M10 5h13v13" />
                </svg>
              </span>
            </button>
          </article>
        ))}
      </div>

      <dialog
        className={styles.dialog}
        data-active={activeQuadrant.key}
        id={dialogId}
        ref={dialogRef}
        aria-modal="true"
        aria-labelledby={`${dialogId}-title`}
        aria-describedby={`${dialogId}-description`}
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") {
            return;
          }

          const dialog = dialogRef.current;
          if (!dialog) {
            return;
          }

          const focusable = Array.from(
            dialog.querySelectorAll<HTMLElement>(
              'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
            ),
          );
          const first = focusable[0];
          const last = focusable.at(-1);

          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className={styles.dialogShell}>
          <header className={styles.dialogBar}>
            <span>常宁居 / 四维决策</span>
            <span>
              {activeQuadrant.index} — {activeQuadrant.englishName}
            </span>
            <button
              className={styles.closeButton}
              type="button"
              ref={closeButtonRef}
              onClick={closeDialog}
            >
              <span>关闭</span>
              <svg viewBox="0 0 28 28" aria-hidden="true">
                <path d="m6 6 16 16M22 6 6 22" />
              </svg>
            </button>
          </header>

          <div className={styles.dialogHero}>
            <div className={styles.dialogVisual}>
              <QuadrantVisual type={activeQuadrant.key} />
              <span className={styles.dialogIndex}>{activeQuadrant.index}</span>
            </div>
            <div className={styles.dialogHeading}>
              <p>{activeQuadrant.eyebrow}</p>
              <h2 id={`${dialogId}-title`}>{activeQuadrant.name}</h2>
              <span>{activeQuadrant.englishName}</span>
            </div>
          </div>

          <div className={styles.dialogBody}>
            <div className={styles.dialogStatement}>
              <p className={styles.statement} id={`${dialogId}-description`}>
                {activeQuadrant.statement}
              </p>
              <p className={styles.detail}>{activeQuadrant.detail}</p>
            </div>

            <ol className={styles.pointList}>
              {activeQuadrant.points.map((point, index) => (
                <li key={point.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{point.title}</h3>
                    <p>{point.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <footer className={styles.statusGrid}>
            <div>
              <p>现阶段 / CURRENT</p>
              <strong>{activeQuadrant.current}</strong>
            </div>
            <div>
              <p>边界 / CAVEAT</p>
              <strong>{activeQuadrant.caveat}</strong>
            </div>
            <button type="button" onClick={closeDialog}>
              返回四维视图
              <svg viewBox="0 0 28 28" aria-hidden="true">
                <path d="M23 14H5m7-7-7 7 7 7" />
              </svg>
            </button>
          </footer>
        </div>
      </dialog>
    </section>
  );
}
