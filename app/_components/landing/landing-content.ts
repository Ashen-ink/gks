export const painChapters = [
  {
    index: "01",
    label: "温度 / Temperature",
    title: ["避暑房的问题，", "并不总是热。"],
    body: "安顺夏季夜间均温约 19.8°C，而贵州各市州夜温相差超过 8°C。自然条件已经不同，一道固定阈值无法适用于全省。",
    metric: "19.8°C",
    metricLabel: "安顺夏季夜间均温",
    evidence: "九市州逐小时气象再分析；再分析数据不等同于本地地面实测。",
    image: "/landing/cold-room.webp",
    imageAlt: "晨光穿过安静房间的窗户",
    imagePosition: "center",
  },
  {
    index: "02",
    label: "湿度 / Humidity",
    title: ["真正持续发生的，", "是潮。"],
    body: "九个市州夏季夜间相对湿度都在 83%–94%。越凉的地方未必越干；最凉的六盘水与黔西南，夜间湿度都接近 94%。",
    metric: "83—94%",
    metricLabel: "九市州夏季夜间相对湿度",
    evidence: "逐小时气象再分析；局地山地小气候仍需现场数据校核。",
    image: "/landing/condensation.webp",
    imageAlt: "凝结在玻璃表面的细密水珠",
    imagePosition: "center",
  },
  {
    index: "03",
    label: "开窗 / Ventilation",
    title: ["风进来了，", "湿气也进来了。"],
    body: "安顺夏季约四分之一的小时有降水。开窗不只是“要不要凉一点”，还要同时判断室外含湿量、未来降雨、来流角度与整屋通风路径。",
    metric: "24%",
    metricLabel: "安顺夏季降水时数占比",
    evidence: "逐小时气象再分析；降雨在当前模型中是最高优先级硬约束。",
    image: "/landing/rain-window.webp",
    imageAlt: "雨滴落在窗面，窗外光线变得模糊",
    imagePosition: "center",
  },
] as const;

export const decisionSteps = [
  {
    index: "01",
    title: "看见此刻",
    body: "读取分房间温湿度、门窗状态与占用时相。",
    tag: "STATE",
  },
  {
    index: "02",
    title: "预见变化",
    body: "结合未来气象与全屋气流路径，预测温度和水汽如何迁移。",
    tag: "FORECAST",
  },
  {
    index: "03",
    title: "比较动作",
    body: "在开窗建议、独立除湿与空调之间，比较舒适、安全与能耗代价。",
    tag: "DECISION",
  },
  {
    index: "04",
    title: "重算下一步",
    body: "只执行当前一步；天气、房间或人的状态改变后重新判断。",
    tag: "RECALCULATE",
  },
] as const;

export const evidenceLegend = [
  {
    label: "数据事实",
    text: "来自九市州逐小时气象再分析；不等同于现场实测。",
  },
  {
    label: "当前模型",
    text: "指安顺基准户型上的物理仿真与滚动优化实现。",
  },
  {
    label: "待实测",
    text: "换气量、本地参数与硬件闭环仍需现场标定。",
  },
  {
    label: "路线图",
    text: "指尚未完成部署或闭环验证的能力。",
  },
] as const;

export const imageCredits = [
  {
    use: "贵州雾山",
    author: "Chengyu Wang",
    href: "https://unsplash.com/photos/misty-mountains-shrouded-in-fog-and-trees-2iF6v_Ce980",
  },
  {
    use: "冷静房间",
    author: "Takashi Sakamoto",
    href: "https://unsplash.com/photos/sunlight-streams-into-an-empty-dimly-lit-room-JQIH5eLRkCM",
  },
  {
    use: "玻璃凝露",
    author: "Cai Fang",
    href: "https://unsplash.com/photos/condensation-droplets-on-a-dark-surface-K3eJuD4BnZM",
  },
  {
    use: "雨夜窗面",
    author: "Yosuke Ota",
    href: "https://unsplash.com/photos/raindrops-on-window-with-blurred-yellow-light-outside-1DKjF93xJbg",
  },
] as const;
