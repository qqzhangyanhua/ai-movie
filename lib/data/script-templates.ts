export type ScriptScene = {
  sceneNumber: number;
  description: string;
  action: string;
  cameraType: "远景" | "中景" | "特写";
  duration: number;
  dialogue?: string;
};

export type ScriptTemplate = {
  id: string;
  title: string;
  category: string;
  description: string;
  scenes: ScriptScene[];
};

export const scriptTemplates: ScriptTemplate[] = [
  {
    id: "rainy-confession",
    title: "雨夜告白",
    category: "爱情",
    description: "雨夜中，男主等待女主出现，鼓起勇气告白",
    scenes: [
      {
        sceneNumber: 1,
        description: "雨夜街头，男主撑着伞独自等待",
        action: "男主站在路灯下，雨水打在伞面上",
        cameraType: "远景",
        duration: 5,
        dialogue: "她应该快到了……",
      },
      {
        sceneNumber: 2,
        description: "女主从雨中走来，男主眼前一亮",
        action: "女主撑着伞走近，两人目光相遇",
        cameraType: "中景",
        duration: 5,
      },
      {
        sceneNumber: 3,
        description: "男主鼓起勇气，向女主告白",
        action: "男主递出伞，深情凝视女主",
        cameraType: "特写",
        duration: 6,
        dialogue: "我喜欢你很久了……",
      },
    ],
  },
  {
    id: "campus-farewell",
    title: "校园告别",
    category: "校园",
    description: "毕业前夕，同学们整理书桌、拍合照、挥手告别",
    scenes: [
      {
        sceneNumber: 1,
        description: "教室里，同学们整理书桌和课本",
        action: "学生们将书本装入书包，环顾教室",
        cameraType: "中景",
        duration: 5,
      },
      {
        sceneNumber: 2,
        description: "大家聚集在操场，拍毕业合照",
        action: "同学们摆出姿势，摄影师按下快门",
        cameraType: "远景",
        duration: 5,
      },
      {
        sceneNumber: 3,
        description: "校门口，同学们挥手告别",
        action: "大家依依不舍地挥手，眼眶泛红",
        cameraType: "特写",
        duration: 6,
      },
    ],
  },
  {
    id: "space-exploration",
    title: "星际探险",
    category: "科幻",
    description: "宇航员检查仪表、穿越小行星带、登陆未知星球",
    scenes: [
      {
        sceneNumber: 1,
        description: "飞船驾驶舱内，宇航员检查各项仪表",
        action: "宇航员查看屏幕数据，确认航线",
        cameraType: "中景",
        duration: 5,
      },
      {
        sceneNumber: 2,
        description: "飞船穿越密集的小行星带",
        action: "飞船灵活躲避陨石，引擎喷射火焰",
        cameraType: "远景",
        duration: 6,
      },
      {
        sceneNumber: 3,
        description: "飞船降落，宇航员踏上未知星球",
        action: "舱门打开，宇航员迈出第一步",
        cameraType: "特写",
        duration: 5,
      },
    ],
  },
  {
    id: "mysterious-letter",
    title: "神秘来信",
    category: "悬疑",
    description: "发现神秘信件、阅读内容、前往调查",
    scenes: [
      {
        sceneNumber: 1,
        description: "主角在信箱中发现一封匿名信",
        action: "主角拿起信封，端详蜡封",
        cameraType: "特写",
        duration: 4,
      },
      {
        sceneNumber: 2,
        description: "主角在书房中阅读信件内容",
        action: "主角展开信纸，神情凝重",
        cameraType: "中景",
        duration: 5,
      },
      {
        sceneNumber: 3,
        description: "主角收拾行装，准备前往信中所指地点",
        action: "主角拿起外套，推门而出",
        cameraType: "远景",
        duration: 5,
      },
    ],
  },
  {
    id: "martial-arts-duel",
    title: "江湖对决",
    category: "武侠",
    description: "竹林对峙、刀剑交锋、日落离去",
    scenes: [
      {
        sceneNumber: 1,
        description: "竹林中，两位侠客相对而立",
        action: "风吹竹叶，两人目光如电",
        cameraType: "远景",
        duration: 5,
      },
      {
        sceneNumber: 2,
        description: "刀剑相交，火星四溅",
        action: "两人激烈交锋，剑光闪烁",
        cameraType: "中景",
        duration: 6,
      },
      {
        sceneNumber: 3,
        description: "夕阳西下，胜者收剑离去",
        action: "一人收剑入鞘，转身走入余晖",
        cameraType: "特写",
        duration: 5,
      },
    ],
  },
  {
    id: "treasure-hunt",
    title: "寻宝奇遇",
    category: "冒险",
    description: "发现藏宝图、密林前行、找到宝藏",
    scenes: [
      {
        sceneNumber: 1,
        description: "主角在旧书中发现一张泛黄的藏宝图",
        action: "主角展开地图，仔细研究路线",
        cameraType: "特写",
        duration: 5,
      },
      {
        sceneNumber: 2,
        description: "主角穿越密林，按图索骥",
        action: "拨开藤蔓，艰难前行",
        cameraType: "中景",
        duration: 5,
      },
      {
        sceneNumber: 3,
        description: "山洞深处，宝箱在火光中闪耀",
        action: "主角打开宝箱，露出惊喜表情",
        cameraType: "远景",
        duration: 6,
      },
    ],
  },
];
