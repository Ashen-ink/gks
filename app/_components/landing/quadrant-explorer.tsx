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
  name: string;
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
    name: "传感",
    eyebrow: "每间房，分开看",
    statement: "卧室和客厅，需要分别测温。",
    detail:
      "每个房间的体感各有差异。温湿度、门窗和占用按房间读取，窗边的风速风向用来校正实际换气量。",
    points: [
      {
        title: "每间房分别测",
        description:
          "卧室、客厅分别保留温湿度数据，模型以房间为单位计算。",
      },
      {
        title: "门窗状态",
        description:
          "门窗磁记录开闭。窗口风速风向说明空气从哪里进、进了多少。",
      },
      {
        title: "房间占用",
        description:
          "占用信号记录房间的使用状态，供温湿度目标调整。",
      },
    ],
    current:
      "当前版本按房间计算温度、含湿量和换气量。关键传感缺失时，控制动作会收紧。",
    caveat:
      "占用采用匿名存在检测，数据范围限于房间使用状态。",
  },
  {
    key: "wind",
    name: "风向",
    eyebrow: "风从哪里进，往哪里走",
    statement: "开窗后的换气量，取决于完整气流路径。",
    detail:
      "单侧开窗和穿堂风是两种工况。门窗位置和室外来流先决定风能走多远，再由含湿量算进屋的水汽。",
    points: [
      {
        title: "先看窗边的风",
        description:
          "窗口风速风向给出实际边界，比气象站里的室外风更接近这套房。",
      },
      {
        title: "再看门窗的路",
        description:
          "模型沿着门、窗和房间的连接关系计算气流。单侧开窗形成局部换气，门窗连通后才可能出现穿堂风。",
      },
      {
        title: "把下一场雨算进去",
        description:
          "短时预报提供降雨、风向和温湿度变化，开窗时机随之调整。",
      },
    ],
    current:
      "当前使用多房间气流网络计算路径。窗口传感器在线时，实测流量会修正计算结果。",
    caveat:
      "手动窗输出开窗建议，电动窗可进入自动控制。强风、降雨或室外高含湿量会关闭开窗选项。",
  },
  {
    key: "environment",
    name: "环境",
    eyebrow: "温度和水汽，两本账",
    statement: "贵州的夏夜，低温常常和高湿一起出现。",
    detail:
      "模型同时算温度和含湿量。室外空气合适时，用它给房间降温。夜里太潮或正在下雨，窗会保持关闭。",
    points: [
      {
        title: "用含湿量算水汽",
        description:
          "计算使用含湿量，界面仍显示更熟悉的相对湿度。降温和除湿由此拆成两项动作。",
      },
      {
        title: "下雨时关闭开窗选项",
        description:
          "降雨会直接关闭开窗选项。太阳、昼夜变化和室外湿度也会进入计算。",
      },
      {
        title: "季节变了，目标也变",
        description:
          "夏天处理凉而潮，冬天减少冷风和供暖损失，长期空置时控制湿度和霉变风险。",
      },
    ],
    current:
      "当前会把自然通风、独立除湿和空调分开试算，再选对温湿度影响更合适的一项。",
    caveat:
      "区域气象数据只能给出策略方向。具体开窗条件和设备响应，还要在真实房屋里标定。",
  },
  {
    key: "pose",
    name: "居住",
    eyebrow: "在住 / 睡眠 / 空置",
    statement: "人睡着后，房子会减少设备切换。",
    detail:
      "在室、入睡、短暂离开和长期空置，各有一套温湿度目标。住户手动操作时，自动控制立即让位。",
    points: [
      {
        title: "人在房间里",
        description:
          "控制先看体感和空气质量，设备运行集中在确有收益的时段。",
      },
      {
        title: "人已经睡着",
        description:
          "夜里收紧启停频率，同时压低噪声和提醒次数。",
      },
      {
        title: "房子空着几个月",
        description:
          "长期空置把目标切换到湿度和霉变风险，并尽量少开设备。",
      },
    ],
    current:
      "当前先用明确规则切换居住状态。个体偏好学习处于后续阶段。",
    caveat:
      "居住状态由匿名占用信号和时间规则判定，人可随时手动接管。",
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
    <section
      className={styles.explorer}
      id="dimensions"
      aria-labelledby="quadrant-title"
    >
      <div className={styles.intro}>
        <div className={styles.introCopy}>
          <h2 id="quadrant-title">房子每次要看四件事。</h2>
          <p>
            每一轮都读取四组数据。各房间的温湿度、窗边的风、室外降雨，以及房屋当前的使用状态。算完这些，再选下一步。
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
              <QuadrantVisual type={quadrant.key} />
              <span className={styles.cardCopy}>
                <span className={styles.cardEyebrow}>{quadrant.eyebrow}</span>
                <span className={styles.cardName}>{quadrant.name}</span>
                <span className={styles.cardStatement}>{quadrant.statement}</span>
              </span>
              <span className={styles.cardAction} aria-hidden="true">
                <span>查看详情</span>
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
            <span>常宁居 · 四项判断依据</span>
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
            </div>
            <div className={styles.dialogHeading}>
              <p>{activeQuadrant.eyebrow}</p>
              <h2 id={`${dialogId}-title`}>{activeQuadrant.name}</h2>
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
              {activeQuadrant.points.map((point) => (
                <li key={point.title}>
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
              <p>目前做到</p>
              <strong>{activeQuadrant.current}</strong>
            </div>
            <div>
              <p>还要注意</p>
              <strong>{activeQuadrant.caveat}</strong>
            </div>
            <button type="button" onClick={closeDialog}>
              返回四项
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
