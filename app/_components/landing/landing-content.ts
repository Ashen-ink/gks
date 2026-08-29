export const painChapters = [
  {
    index: "01",
    label: "温度 / Temperature",
    title: ["九个市州，", "夜温相差超过 8°C。"],
    body: "安顺夏季夜间均温约 19.8°C，九个市州的夜间均温相差超过 8°C。各城市、房型需要分别标定控制参数。",
    metric: "19.8°C",
    metricLabel: "安顺夏季夜间均温",
    evidence: "数据源为九市州逐小时气象再分析。房屋现场实测留待下一阶段。",
    image: "/landing/cold-room.webp",
    imageAlt: "晨光穿过安静房间的窗户",
    imagePosition: "center",
  },
  {
    index: "02",
    label: "湿度 / Humidity",
    title: ["九个市州的夏夜，", "湿度都超过 83%。"],
    body: "九个市州夏季夜间相对湿度落在 83%—94%。六盘水和黔西南夜里较凉，相对湿度仍接近 94%。气温降下来，水汽仍留在空气里。",
    metric: "83—94%",
    metricLabel: "九市州夏季夜间相对湿度",
    evidence: "数据源为逐小时气象再分析。山地小气候还要到现场校准。",
    image: "/landing/condensation.webp",
    imageAlt: "凝结在玻璃表面的细密水珠",
    imagePosition: "center",
  },
  {
    index: "03",
    label: "开窗 / Ventilation",
    title: ["安顺的夏天，", "四小时里约一小时有雨。"],
    body: "开窗判断同时读取室外含湿量、短时降雨、窗口风向和门窗连通。温度说明窗外冷暖，其余信息决定这股风会带进多少水汽。",
    metric: "24%",
    metricLabel: "安顺夏季降水时数占比",
    evidence: "数据源为逐小时气象再分析。降雨时，当前模型关闭开窗选项。",
    image: "/landing/rain-window.webp",
    imageAlt: "雨滴落在窗面，窗外光线变得模糊",
    imagePosition: "center",
  },
] as const;

export const decisionSteps = [
  {
    index: "01",
    title: "读取房间",
    body: "分别读取卧室、客厅的温湿度、门窗开闭和是否有人。",
    tag: "STATE",
  },
  {
    index: "02",
    title: "接入天气",
    body: "加入室外温湿度、风向、风速和短时降雨预报。",
    tag: "FORECAST",
  },
  {
    index: "03",
    title: "逐个试算",
    body: "分别计算保持现状、建议开窗、独立除湿和开空调之后的温湿度。",
    tag: "DECISION",
  },
  {
    index: "04",
    title: "执行当前动作",
    body: "天气、房间或人的状态一变，下一轮便用新数据重新计算。",
    tag: "RECALCULATE",
  },
] as const;

export const evidenceLegend = [
  {
    label: "气象数据",
    text: "页面使用九市州逐小时气象再分析。现场传感器实测留待下一阶段。",
  },
  {
    label: "已经完成",
    text: "安顺基准户型上的多房间热湿仿真和滚动优化。",
  },
  {
    label: "还要实测",
    text: "换气量、本地参数和设备响应，要在真实房屋里标定。",
  },
  {
    label: "尚未完成",
    text: "偏好学习和整屋硬件闭环仍在后续计划中。",
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
    author: "Zahraa Hassan",
    href: "https://unsplash.com/photos/sunlight-streams-onto-a-rumpled-bed-through-a-window-4ti8uDIv8MQ",
  },
  {
    use: "玻璃凝露",
    author: "همَّام",
    href: "https://unsplash.com/photos/condensation-forms-on-a-glass-window-dE2QfFmAXX8",
  },
  {
    use: "雨夜窗面",
    author: "İsmail Efe Top",
    href: "https://unsplash.com/photos/rainy-window-from-the-inside-x1MMm4d1szE",
  },
] as const;
