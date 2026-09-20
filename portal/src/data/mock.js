/**
 * Mock 数据层
 * ------------------------------------------------------------------
 * 全部为高质量示意内容，围绕迪卡侬中国的真实数字化形态构造：
 * 微信小程序商城 / 迪卡侬 App / 门店 POS 与自助结账 / 电子价签 /
 * 会员与 CRM / 库存与供应链 / 线上商城 decathlon.com.cn / 数据平台。
 * 不接任何外部 API，数字取合理量级，不编造夸张统计。
 */

export const META = {
  department: 'Decathlon China · Digital 部门',
  portalName: 'Digital 门户',
  owner: 'Digital 部门运营组 · 周敏',
  updated: '2026-09-17 18:40',
  watermark: 'Decathlon Digital · 内部资料 · 请勿外传',
};

/* ============================ 首页 · 今日 Hub ============================ */

export const pinnedResolutions = [
  {
    id: 'DEC-DIGI-2026-0912',
    pinned: true,
    title: '关于 Q3 会员积分规则调整的决议',
    summary:
      '经 Digital 部门与会员中心联合评审：自 2026-10-01 起，会员积分有效期由「次年年底」收敛为「自然年 12 月 31 日」。涉及会员小程序、迪卡侬 App、门店 POS 三端的积分展示、到期提醒与核销逻辑，需在 9 月 28 日前完成灰度。',
    body:
      '本决议经 Digital 部门技术评审会第 38 期表决通过。落地要求：① 会员小程序与 App 端在 9 月 28 日前上线到期提醒；② 门店 POS 端在核销小票增加积分到期说明；③ 数据平台同步调整积分生命周期看板口径。灰度范围先开放华东 12 家门店，观察一周后全量。',
    meeting: 'Digital 部门技术评审会 · 第 38 期',
    effective: '2026-10-01',
    owner: '会员增长组 · 陈思远',
    updated: '2026-09-17',
  },
  {
    id: 'DEC-DIGI-2026-0908',
    pinned: true,
    title: '门店自助结账终端统一为「扫码 + 刷脸」双通道',
    summary:
      '为避免设备型号碎片化，后续新开门店与设备更换统一采用双通道终端；存量单通道终端按季度节奏分批替换，替换期间的兼容由门店 POS v3.2 负责承接。',
    body:
      '设备收敛的核心动机是减少固件分支。存量单通道终端约 3 个型号，计划分 4 个季度替换完成。POS v3.2 需要提供双通道的能力探测与降级路径，避免出现「设备已换、软件未适配」的空窗。',
    meeting: '数字化门店专项会 · 第 12 期',
    effective: '2026-09-15',
    owner: '门店数字化组 · 林望',
    updated: '2026-09-15',
  },
];

export const healthSnapshot = [
  {
    key: 'availability',
    label: '核心系统可用性',
    value: '99.95',
    unit: '%',
    delta: -0.02,
    deltaUnit: '%',
    deltaLabel: '较上周',
    higherIsBetter: true,
    spark: [99.97, 99.96, 99.98, 99.95, 99.94, 99.96, 99.95],
    note: '口径：线上商城 + 会员 + 门店 POS 加权',
  },
  {
    key: 'latency',
    label: '平均响应时间 P95',
    value: '218',
    unit: 'ms',
    delta: 6,
    deltaUnit: 'ms',
    deltaLabel: '较上周',
    higherIsBetter: false,
    spark: [205, 210, 208, 214, 220, 216, 218],
    note: '口径：核心接口网关采样',
  },
  {
    key: 'errorRate',
    label: '错误率',
    value: '0.12',
    unit: '%',
    delta: -0.03,
    deltaUnit: '%',
    deltaLabel: '较上周',
    higherIsBetter: false,
    spark: [0.18, 0.16, 0.15, 0.14, 0.13, 0.12, 0.12],
    note: '口径：5xx / 总请求',
  },
  {
    key: 'errorBudget',
    label: '本月错误预算余量',
    value: '62',
    unit: '%',
    delta: 8,
    deltaUnit: '%',
    deltaLabel: '较月初',
    higherIsBetter: true,
    spark: [100, 92, 84, 76, 70, 66, 62],
    note: 'SLO 99.95% · 预算周期为本自然月',
  },
];

export const recentReleases = [
  {
    version: 'v3.2.1',
    name: '门店 POS',
    date: '2026-09-17',
    summary: '修复优惠券并发核销导致的重复抵扣；优化离线补单队列',
    status: 'released',
  },
  {
    version: 'v2.8.0',
    name: '会员小程序',
    date: '2026-09-15',
    summary: '新增「运动档案」模块，支持按运动品类记录装备与里程',
    status: 'released',
  },
  {
    version: 'v1.14.2',
    name: '线上商城',
    date: '2026-09-12',
    summary: '商品详情页首屏渲染优化，图片资源改为按需加载',
    status: 'released',
  },
  {
    version: 'v3.3.0',
    name: '门店 POS',
    date: '2026-09-24',
    summary: '双通道终端能力探测与降级路径（灰度中）',
    status: 'gray',
  },
  {
    version: 'v2.9.0',
    name: '迪卡侬 App',
    date: '2026-09-30',
    summary: '积分到期提醒入口；首页改版 A/B 实验位',
    status: 'planned',
  },
];

export const milestones = [
  { date: '2026-09-20', title: '智能补货项目 M3 里程碑', tag: '里程碑', owner: '供应链数字化组' },
  { date: '2026-09-28', title: '积分规则调整灰度观察期结束', tag: '决议', owner: '会员增长组' },
  { date: '2026-10-01', title: '积分新规则全量生效', tag: '里程碑', owner: '会员增长组' },
  { date: '2026-10-15', title: '线上商城改版进入 UAT', tag: '节点', owner: '电商平台组' },
  { date: '2026-10-31', title: '电子价签 PoC 阶段验收', tag: '节点', owner: '门店数字化组' },
];

export const quickLinks = [
  { key: 'grafana', label: 'Grafana 监控看板', icon: 'AreaChartOutlined', path: '#/ops' },
  { key: 'jenkins', label: 'Jenkins 流水线', icon: 'DeploymentUnitOutlined', path: '#/workspace/tools/delivery' },
  { key: 'tracking', label: '埋点平台', icon: 'RadarChartOutlined', path: '#/workspace/tools/business' },
  { key: 'device', label: '门店设备管理后台', icon: 'ShopOutlined', path: '#/workspace/tools/business' },
  { key: 'cms', label: '商城内容后台', icon: 'FileTextOutlined', path: '#/workspace/tools/business' },
  { key: 'data', label: '数据平台', icon: 'DatabaseOutlined', path: '#/workspace/tools/data' },
  { key: 'pospre', label: 'POS 预发环境', icon: 'ExperimentOutlined', path: '#/workspace/tools/delivery' },
  { key: 'sso', label: 'SSO 权限申请', icon: 'SafetyCertificateOutlined', path: '#/workspace/tools/delivery' },
];

export const agentPrompts = [
  '新系统接入 SSO 的流程是什么？',
  '生产环境数据库只读权限怎么申请？',
  '小程序首屏性能有哪些既定优化手段？',
  '大促期间库存扣减的一致性是怎么保证的？',
];

/* ============================== 信息中心 ============================== */

export const newsChannels = [
  { key: 'announce', label: '公告与决议' },
  { key: 'release', label: '产品 Release' },
  { key: 'project', label: '项目动态' },
];

export const announcements = [
  {
    id: 'an-001',
    feature: true,
    isNew: true,
    channel: '公告与决议',
    title: '门店自助结账 v3.2 全量上线通知',
    summary:
      '自助结账 v3.2 于 9 月 15 日完成全量上线，覆盖全国门店。本次上线引入扫码与刷脸双通道适配层，并统一了小票模板。若门店出现设备识别失败，请按《自助结账故障排查手册》第 3 节处理。',
    date: '2026-09-16',
    owner: '门店数字化组 · 林望',
    tags: ['上线通知', '门店'],
  },
  {
    id: 'an-002',
    isNew: true,
    channel: '公告与决议',
    title: 'Q3 会员积分规则调整（已决议）',
    summary: '积分有效期收敛为自然年 12 月 31 日，10 月 1 日生效。三端改造排期见决议正文。',
    date: '2026-09-17',
    owner: '会员增长组 · 陈思远',
    tags: ['决议', '会员'],
  },
  {
    id: 'an-003',
    channel: '公告与决议',
    title: '关于国庆大促期间变更冻结窗口的通知',
    summary: '9 月 28 日 18:00 至 10 月 8 日 09:00 为变更冻结期，除 P0 故障修复外不发布生产变更。',
    date: '2026-09-14',
    owner: 'SRE 组 · 何嘉',
    tags: ['流程', '大促'],
  },
  {
    id: 'an-004',
    channel: '公告与决议',
    title: '埋点规范 v2 发布：事件命名与参数收敛',
    summary: '新埋点一律遵循 v2 规范，存量事件在 12 月 31 日前完成迁移。',
    date: '2026-09-11',
    owner: '数据平台组 · 沈知微',
    tags: ['规范', '数据'],
  },
  {
    id: 'an-005',
    channel: '公告与决议',
    title: '生产环境访问审计范围扩大至只读查询',
    summary: '自 10 月 1 日起，生产库只读查询纳入审计日志，保留 180 天。',
    date: '2026-09-09',
    owner: '安全合规 · 顾一鸣',
    tags: ['安全', '合规'],
  },
];

export const releaseNotes = [
  {
    version: 'v3.2.1',
    system: '门店 POS',
    date: '2026-09-17',
    status: 'released',
    items: 3,
    owner: '林望',
    summary: '修复优惠券并发核销导致的重复抵扣',
    changeType: 'fix',
  },
  {
    version: 'v2.8.0',
    system: '会员小程序',
    date: '2026-09-15',
    status: 'released',
    items: 5,
    owner: '陈思远',
    summary: '新增「运动档案」模块',
    changeType: 'feat',
  },
  {
    version: 'v3.3.0',
    system: '门店 POS',
    date: '2026-09-24',
    status: 'gray',
    items: 4,
    owner: '林望',
    summary: '双通道终端能力探测与降级路径',
    changeType: 'feat',
  },
  {
    version: 'v1.14.2',
    system: '线上商城',
    date: '2026-09-12',
    status: 'released',
    items: 2,
    owner: '刘倩',
    summary: '商品详情页首屏渲染优化',
    changeType: 'perf',
  },
  {
    version: 'v2.9.0',
    system: '迪卡侬 App',
    date: '2026-09-30',
    status: 'planned',
    items: 6,
    owner: '周立',
    summary: '积分到期提醒入口与首页实验位',
    changeType: 'feat',
  },
  {
    version: 'v0.9.4',
    system: '电子价签',
    date: '2026-09-10',
    status: 'released',
    items: 3,
    owner: '吴桐',
    summary: '价签刷新失败自动重试',
    changeType: 'fix',
  },
];

export const projectUpdates = [
  {
    id: 'pj-001',
    isNew: true,
    channel: '项目动态',
    title: '智能补货项目达成 M2 里程碑',
    summary:
      '已完成历史销量特征工程与 3 个门店的补货建议对照实验，建议采纳率较人工基线有稳定提升。M3 将进入 20 家门店的扩大验证。',
    date: '2026-09-15',
    owner: '供应链数字化组 · 郑远',
    tags: ['里程碑', '供应链'],
  },
  {
    id: 'pj-002',
    channel: '项目动态',
    title: '线上商城改版：本周评审结论',
    summary: '首页信息架构确定采用「品类 + 运动场景」双入口，评审会上确认了搜索结果页的排序策略。',
    date: '2026-09-13',
    owner: '电商平台组 · 刘倩',
    tags: ['评审', '电商'],
  },
  {
    id: 'pj-003',
    channel: '项目动态',
    title: '电子价签 PoC 进入第 2 阶段',
    summary: '首店信号覆盖测试通过，第 2 阶段验证批量刷新耗时与电池续航。',
    date: '2026-09-10',
    owner: '门店数字化组 · 吴桐',
    tags: ['PoC', '门店'],
  },
  {
    id: 'pj-004',
    channel: '项目动态',
    title: '会员与 CRM 数据打通完成预演',
    summary: '会员标签回流链路完成一次全量预演，数据一致性校验通过。',
    date: '2026-09-08',
    owner: '数据平台组 · 沈知微',
    tags: ['数据', '会员'],
  },
];

export const newsTagFilters = ['全部', '上线通知', '决议', '流程', '规范', '安全', '里程碑'];
export const newsTimeRanges = [
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
  { value: '90d', label: '近 90 天' },
  { value: 'all', label: '全部时间' },
];

/* ============================== 监控运营 ============================== */

export const opsKpis = [
  {
    key: 'avail',
    label: '核心系统可用性',
    value: '99.95',
    unit: '%',
    delta: -0.02,
    deltaUnit: '%',
    higherIsBetter: true,
    status: 'success',
    threshold: 'SLO ≥ 99.95%',
    spark: [99.97, 99.96, 99.98, 99.95, 99.94, 99.96, 99.95],
  },
  {
    key: 'p95',
    label: 'P95 响应时间',
    value: '218',
    unit: 'ms',
    delta: 6,
    deltaUnit: 'ms',
    higherIsBetter: false,
    status: 'warning',
    threshold: '阈值 ≤ 250ms',
    spark: [205, 210, 208, 214, 220, 216, 218],
  },
  {
    key: 'err',
    label: '错误率',
    value: '0.12',
    unit: '%',
    delta: -0.03,
    deltaUnit: '%',
    higherIsBetter: false,
    status: 'success',
    threshold: '阈值 ≤ 0.20%',
    spark: [0.18, 0.16, 0.15, 0.14, 0.13, 0.12, 0.12],
  },
  {
    key: 'budget',
    label: '错误预算余量',
    value: '62',
    unit: '%',
    delta: 8,
    deltaUnit: '%',
    higherIsBetter: true,
    status: 'success',
    threshold: '目标 ≥ 50%',
    spark: [100, 92, 84, 76, 70, 66, 62],
  },
  {
    key: 'alerts',
    label: '活跃告警',
    value: '4',
    unit: '条',
    delta: -2,
    deltaUnit: '条',
    higherIsBetter: false,
    status: 'warning',
    threshold: 'P1 告警 1 条',
    spark: [7, 6, 6, 5, 5, 6, 4],
  },
  {
    key: 'orders',
    label: '订单处理成功率',
    value: '99.87',
    unit: '%',
    delta: 0.04,
    deltaUnit: '%',
    higherIsBetter: true,
    status: 'success',
    threshold: 'SLO ≥ 99.80%',
    spark: [99.79, 99.81, 99.83, 99.82, 99.85, 99.86, 99.87],
  },
];

export const opsCharts = {
  availability: {
    title: '核心系统可用性趋势',
    unit: '%',
    x: ['09-11', '09-12', '09-13', '09-14', '09-15', '09-16', '09-17'],
    yDomain: [99.9, 100],
    series: [
      { name: '线上商城', data: [99.98, 99.97, 99.96, 99.95, 99.97, 99.96, 99.97] },
      { name: '会员与 CRM', data: [99.99, 99.99, 99.98, 99.97, 99.98, 99.98, 99.99] },
      { name: '门店 POS', data: [99.95, 99.93, 99.94, 99.9, 99.96, 99.94, 99.95] },
    ],
  },
  latency: {
    title: '各系统 P95 响应时间',
    unit: 'ms',
    x: ['线上商城', '会员', '门店 POS', '库存', '价签', '数据平台'],
    values: [218, 164, 142, 305, 96, 188],
  },
  errorRate: {
    title: '错误率趋势',
    unit: '%',
    x: ['09-11', '09-12', '09-13', '09-14', '09-15', '09-16', '09-17'],
    yDomain: [0, 0.25],
    series: [{ name: '错误率', data: [0.18, 0.16, 0.15, 0.14, 0.13, 0.12, 0.12] }],
  },
  alertDistribution: {
    title: '告警分布（按系统）',
    unit: '条',
    items: [
      { name: '门店 POS', value: 6 },
      { name: '库存服务', value: 4 },
      { name: '线上商城', value: 3 },
      { name: '会员与 CRM', value: 2 },
      { name: '电子价签', value: 1 },
    ],
  },
};

export const stabilityItems = [
  { system: '线上商城 decathlon.com.cn', status: 'success', label: '正常', detail: '可用性 99.97% · P95 218ms' },
  { system: '会员与 CRM', status: 'success', label: '正常', detail: '可用性 99.99% · 标签回流正常' },
  { system: '门店 POS', status: 'warning', label: '预警', detail: '华东 2 家门店离线补单队列积压' },
  { system: '库存与供应链', status: 'error', label: '异常', detail: '补货建议服务 1 次超时重启，已恢复' },
  { system: '电子价签', status: 'warning', label: '预警', detail: '批量刷新耗时高于基线 18%' },
  { system: '数据平台', status: 'success', label: '正常', detail: '离线任务全部按时完成' },
];

export const drilldowns = [
  {
    key: 'grafana',
    title: 'Grafana 监控看板',
    desc: '需要看时序明细、自定义面板或历史回溯时，前往 Grafana 查看。',
    action: '打开 Grafana',
  },
  {
    key: 'log',
    title: '日志检索平台',
    desc: '定位具体请求链路与异常堆栈，按 traceId 检索。',
    action: '打开日志平台',
  },
  {
    key: 'oncall',
    title: '告警与值班',
    desc: '查看告警的认领状态、值班表与升级路径。',
    action: '打开值班看板',
  },
];

/* ============================== 知识中心 ============================== */

export const knowledgeTabs = [
  { key: 'practice', label: '最佳实践' },
  { key: 'spec', label: '设计规范' },
  { key: 'faq', label: 'FAQ' },
];

export const bestPractices = [
  {
    id: 'bp-stock-dedup',
    title: '大促期间库存扣减的一致性处理',
    category: '供应链',
    summary: '库存扣减以「预占 + 确认 + 超时释放」三段式为主，避免超卖与死锁。本文给出幂等键设计与补偿策略。',
    author: '郑远',
    updated: '2026-09-12',
    readMin: 9,
  },
  {
    id: 'bp-miniapp-perf',
    title: '小程序首屏性能优化实践',
    category: '前端',
    summary: '从分包加载、首屏接口合并、资源按需加载三个方向拆解，给出可复用的性能预算与验收基线。',
    author: '陈思远',
    updated: '2026-09-08',
    readMin: 12,
  },
  {
    id: 'bp-sso-onboard',
    title: '新系统接入 SSO 的标准流程',
    category: '平台',
    summary: '统一身份接入的申请、联调、灰度、验收四步法，附客户端配置模板与常见报错对照表。',
    author: '何嘉',
    updated: '2026-09-05',
    readMin: 7,
  },
  {
    id: 'bp-tracking-v2',
    title: '埋点规范 v2 落地指引',
    category: '数据',
    summary: '事件命名、参数收敛、上报时机三部分说明，帮助你把手上的埋点一次性做对。',
    author: '沈知微',
    updated: '2026-09-11',
    readMin: 6,
  },
  {
    id: 'bp-pos-offline',
    title: '门店 POS 离线补单的可靠性设计',
    category: '门店',
    summary: '断网场景下的本地队列、幂等回放与对账口径，附压测结论与容量建议。',
    author: '林望',
    updated: '2026-09-02',
    readMin: 10,
  },
  {
    id: 'bp-promo-parallel',
    title: '促销并发核销的防重设计',
    category: '交易',
    summary: '优惠券并发核销的常见坑与分布式锁选型，含一次真实故障的复盘时间线。',
    author: '刘倩',
    updated: '2026-08-29',
    readMin: 8,
  },
];

export const practiceCategories = ['全部', '供应链', '前端', '平台', '数据', '门店', '交易'];

export const designSpecs = [
  {
    id: 'ds-01',
    title: '色彩与语义色使用规则',
    desc: '品牌蓝仅用于 CTA / 激活 / 强调；深墨色顶栏承担面积色；语义色只在稳定性状态区集中出现。',
    updated: '2026-09-16',
    owner: '设计系统组 · 周敏',
  },
  {
    id: 'ds-02',
    title: '字号阶梯与等宽数字',
    desc: 'display 32 / h1 24 / h2 20 / h3 16 / body 14 / 阅读正文 16。版本号、ID、指标值一律等宽。',
    updated: '2026-09-16',
    owner: '设计系统组 · 周敏',
  },
  {
    id: 'ds-03',
    title: '圆角与形状签名',
    desc: '胶囊 999px 用于按钮、标签、搜索框；卡片 8px、控件 6px、浮层 12px。',
    updated: '2026-09-14',
    owner: '设计系统组 · 周敏',
  },
  {
    id: 'ds-04',
    title: '图标体系',
    desc: '单色线性 outline，24×24 网格、1.5px 线宽、round cap；禁用 emoji 与彩色插画图标。',
    updated: '2026-09-14',
    owner: '设计系统组 · 周敏',
  },
  {
    id: 'ds-05',
    title: '内容负责人机制',
    desc: '每个内容区块需标注负责人与最后更新时间，超过 90 天未更新自动进入待复核队列。',
    updated: '2026-09-09',
    owner: '内容运营 · 孙玥',
  },
];

export const designLinks = [
  { id: 'dl-01', title: '设计令牌（Figma Variables）', desc: '色彩 / 排版 / 间距的变量集合，与前端 theme.js 同源。', type: 'Figma' },
  { id: 'dl-02', title: '组件库与使用示例', desc: '基于 Ant Design 5 的主题化组件，含胶囊与等宽数字变体。', type: '组件库' },
  { id: 'dl-03', title: '图标资产（Outlined 24px）', desc: '统一 1.5px 线宽的线性图标资产包。', type: '资产' },
  { id: 'dl-04', title: '可访问性检查清单', desc: '对比度、焦点可见性、键盘可用性的最小检查项。', type: '清单' },
];

export const faqs = [
  {
    id: 'faq-01',
    question: '如何申请生产环境数据库只读权限？',
    answer:
      '在顶部导航「业务需求」里点「新增需求」提交权限申请，选择「数据权限 - 只读」类型，填写系统名与库名、用途与期限。审批人为该系统负责人与安全合规，一般 1 个工作日内完成。权限默认有效期 90 天，到期需重新申请。',
    category: '权限',
    helpful: 46,
    notHelpful: 3,
    updated: '2026-09-13',
    owner: '安全合规 · 顾一鸣',
  },
  {
    id: 'faq-02',
    question: '新系统接入 SSO 的流程是什么？',
    answer:
      '四步：① 提交接入申请（附系统标识与回调地址）；② 平台组发放客户端配置并完成联调；③ 灰度一小部分用户验证登录与登出；④ 验收并归档。详见最佳实践《新系统接入 SSO 的标准流程》。',
    category: '平台',
    helpful: 38,
    notHelpful: 2,
    updated: '2026-09-10',
    owner: 'SRE 组 · 何嘉',
  },
  {
    id: 'faq-03',
    question: '生产变更的发布窗口与冻结期怎么查？',
    answer:
      '常规发布窗口为工作日 10:00–17:30。大促与节假日会设置变更冻结期，冻结期公告会发布在「信息中心 · 公告与决议」。国庆冻结期为 9 月 28 日 18:00 至 10 月 8 日 09:00。',
    category: '流程',
    helpful: 29,
    notHelpful: 5,
    updated: '2026-09-14',
    owner: 'SRE 组 · 何嘉',
  },
  {
    id: 'faq-04',
    question: '埋点事件命名不对，需要重新上报吗？',
    answer:
      '先对照《埋点规范 v2》检查是命名问题还是参数问题。命名不规范需要按规范重新上报，并提交一次变更记录；参数缺失通常会直接影响可用性，建议优先修复。存量事件需在 12 月 31 日前完成迁移。',
    category: '数据',
    helpful: 22,
    notHelpful: 7,
    updated: '2026-09-11',
    owner: '数据平台组 · 沈知微',
  },
  {
    id: 'faq-05',
    question: '门店 POS 离线补单数据对不上怎么排查？',
    answer:
      '按「本地队列 → 幂等回放 → 对账口径」顺序排查。可先在设备管理后台导出本地队列快照，确认是否存在未回放的记录，再核对对账口径是否包含退货单。',
    category: '门店',
    helpful: 17,
    notHelpful: 4,
    updated: '2026-09-06',
    owner: '门店数字化组 · 林望',
  },
];

/** 「待补知识」队列：用户反馈「没帮到我」的问题会进入这里等待补齐 */
export const faqBacklog = [
  {
    id: 'bl-01',
    question: '电子价签批量刷新失败如何定位？',
    votes: 7,
    requestedBy: '门店数字化组',
    age: '3 天',
    status: 'pending',
  },
  {
    id: 'bl-02',
    question: '会员标签回流的延迟口径是多少？',
    votes: 5,
    requestedBy: '数据平台组',
    age: '5 天',
    status: 'inprogress',
  },
  {
    id: 'bl-03',
    question: '如何在预发环境复现线上库存并发问题？',
    votes: 4,
    requestedBy: '供应链数字化组',
    age: '6 天',
    status: 'pending',
  },
];

/* ============================== 文章详情 ============================== */

export const articles = {
  'bp-stock-dedup': {
    id: 'bp-stock-dedup',
    title: '大促期间库存扣减的一致性处理',
    category: '最佳实践 / 供应链',
    author: '郑远',
    authorRole: '供应链数字化组',
    updated: '2026-09-12',
    readMin: 9,
    owner: '供应链数字化组 · 郑远',
    toc: ['背景与问题', '三段式扣减模型', '幂等键设计', '超时释放与补偿', '压测与容量结论'],
    body: [
      {
        type: 'p',
        text: '大促期间的库存扣减是一个「高并发 + 强一致」的交叉问题。过去两个大促我们遇到过两类问题：一类是并发导致的超卖，另一类是超时释放不及时造成的「锁死」。本文给出当前的标准处理方式。',
      },
      { type: 'h2', text: '背景与问题' },
      {
        type: 'p',
        text: '库存服务在峰值时会承受远高于日常的写压力。直接对库存行加悲观锁会把热点集中到单行，导致大量请求排队并放大响应时间。',
      },
      { type: 'h2', text: '三段式扣减模型' },
      {
        type: 'p',
        text: '我们的做法是把一次扣减拆成「预占 → 确认 → 超时释放」三段，预占阶段只在缓存层做原子累加，确认阶段落库，未确认的预占由定时任务释放。',
      },
      {
        type: 'pre',
        text: `// 预占：以 skuId 为键做原子累加，返回预占凭证\nconst ticket = await reserve({\n  skuId,\n  qty,\n  orderNo,          // 幂等键：同一订单重复调用返回同一凭证\n  ttl: 15 * 60,     // 预占有效期 15 分钟\n});\nif (!ticket.ok) {\n  throw new SoldOutError(skuId);\n}`,
      },
      { type: 'h2', text: '幂等键设计' },
      {
        type: 'p',
        text: '幂等键使用「订单号 + 库存变更类型」，而不是请求 ID。原因是重试往往发生在网关重发而非用户重提，只有业务维度的键才能覆盖这种重试。',
      },
      { type: 'h2', text: '超时释放与补偿' },
      { type: 'p', text: '超时释放由独立的定时任务承担，扫描未确认的预占记录并回滚。为避免误释放，释放前会二次校验订单状态。' },
      { type: 'h2', text: '压测与容量结论' },
      {
        type: 'p',
        text: '在 3000 QPS 的持续压测下，预占环节 P95 保持在 40ms 以内；确认环节受落库影响较大，P95 约 120ms。建议大促前把预占 TTL 从 15 分钟下调到 10 分钟，以减少内存占用。',
      },
    ],
  },
  'bp-miniapp-perf': {
    id: 'bp-miniapp-perf',
    title: '小程序首屏性能优化实践',
    category: '最佳实践 / 前端',
    author: '陈思远',
    authorRole: '会员增长组',
    updated: '2026-09-08',
    readMin: 12,
    owner: '会员增长组 · 陈思远',
    toc: ['性能预算', '分包加载', '首屏接口合并', '资源按需加载', '验收基线'],
    body: [
      {
        type: 'p',
        text: '小程序首屏是转化漏斗的第一环。我们把首屏拆成「框架启动 → 主包加载 → 首屏数据 → 首屏渲染」四段，分别设定预算，任何一次改动都不允许超出预算。',
      },
      { type: 'h2', text: '性能预算' },
      {
        type: 'p',
        text: '主包体积不超过 1.2MB，首屏接口合并后不超过 2 个，首屏可交互时间不超过 1.8s（中端机型）。超预算的改动需要性能组复核。',
      },
      { type: 'h2', text: '分包加载' },
      {
        type: 'p',
        text: '把非首屏页面（运动档案、订单详情、社区）全部拆到子包，主包只保留首页、登录与基础组件。',
      },
      { type: 'h2', text: '首屏接口合并' },
      {
        type: 'pre',
        text: `// 合并前：3 次串行请求\n// banner → 会员信息 → 推荐商品\n\n// 合并后：1 次聚合请求\nconst home = await request('/miniapp/home/aggregate', {\n  fields: ['banner', 'member', 'recommend'],\n});`,
      },
      { type: 'h2', text: '资源按需加载' },
      { type: 'p', text: '首屏图片全部走 CDN 并指定尺寸，避免大图缩放；首屏不加载任何非必要字体。' },
      { type: 'h2', text: '验收基线' },
      {
        type: 'p',
        text: '每次发版前在固定的 3 台中端机型上跑一次基准测试，与上一版对比。任何指标劣化超过 5% 需要说明原因。',
      },
    ],
  },
  'bp-sso-onboard': {
    id: 'bp-sso-onboard',
    title: '新系统接入 SSO 的标准流程',
    category: '最佳实践 / 平台',
    author: '何嘉',
    authorRole: '平台组',
    updated: '2026-09-05',
    readMin: 7,
    owner: 'SRE 组 · 何嘉',
    toc: ['适用场景', '四步接入法', '客户端配置', '常见报错'],
    body: [
      { type: 'p', text: '任何需要统一身份的内部系统都应接入 SSO，避免出现独立账号体系。本文是可复用的标准流程。' },
      { type: 'h2', text: '适用场景' },
      { type: 'p', text: '内部管理后台、数据平台、监控看板、以及对内开放的接口平台。' },
      { type: 'h2', text: '四步接入法' },
      { type: 'p', text: '① 申请：提交系统标识与回调地址；② 联调：平台组发放客户端配置；③ 灰度：小范围验证登录登出；④ 验收：归档配置与流程图。' },
      { type: 'h2', text: '客户端配置' },
      {
        type: 'pre',
        text: `{\n  "clientId": "digital-portal",\n  "redirectUri": "https://portal.internal.digital/callback",\n  "scopes": ["openid", "profile", "email"],\n  "pkce": true\n}`,
      },
      { type: 'h2', text: '常见报错' },
      { type: 'p', text: '最常见的是回调地址未登记导致的 redirect_uri_mismatch，其次是回调地址用了 http 而非 https。' },
    ],
  },
};

/* =============================== 工作台 =============================== */

/* ======================================================================
   统一 Digital 标签体系（词表 / 人×标签 / 实证度解算）
   规范来源：outputs/v041-requirements.md + outputs/v041-design-tokens.md。
   模型（v0.4.1 单树）：一棵技能标签树 —— 一级分组（7 组）× 成熟度（双轨）。
   不再有正交的「轴」概念：`axis` 字段已从词表彻底删除。
   唯一性铁律：同一个标签 id 只在树中出现一次（一个 group）。
   ====================================================================== */

/**
 * TAG_DICT —— 受限词表（管理员维护）。
 * 每条：{ id, label, group, status, aliases[], mergedInto }
 *   group  ∈ SKILL_GROUPS 的 7 个分组名之一（逐字一致）
 *   status ∈ 'active' | 'deprecated' | 'merged'（三态，不得扩展）
 *   aliases 用于把既有 mock 的 category / tags 映射到标签。
 *
 * 7 个一级分组（顺序即渲染顺序，不可改）：
 *   1 AI 与算法 · 2 工程与架构 · 3 数据与分析 · 4 产品与设计
 *   5 业务与场景 · 6 平台与安全 · 7 协作与流程
 */
export const TAG_DICT = [
  /* —— 分组 1 · AI 与算法 —— */
  { id: 'd-ai', label: 'AI 与智能', group: 'AI 与算法', status: 'active', aliases: ['人工智能', 'AI'] },
  { id: 'd-rag', label: 'RAG', group: 'AI 与算法', status: 'active', aliases: [] },
  { id: 'd-agent', label: 'Agent', group: 'AI 与算法', status: 'active', aliases: ['智能体'] },
  { id: 'd-vector', label: '向量检索', group: 'AI 与算法', status: 'active', aliases: [] },
  { id: 'd-prompt', label: '提示词工程', group: 'AI 与算法', status: 'active', aliases: [] },
  { id: 'd-llm-eval', label: '模型评测', group: 'AI 与算法', status: 'active', aliases: [] },
  { id: 'c-ml', label: '算法与建模', group: 'AI 与算法', status: 'active', aliases: ['算法'] },

  /* —— 分组 1 · 历史标签（deprecated / merged，用于展示 chip 状态）—— */
  {
    id: 'd-ai-stack',
    label: 'AI 技术栈',
    group: 'AI 与算法',
    status: 'deprecated',
    aliases: [],
  },
  {
    id: 'd-agent-framework',
    label: 'Agent 框架',
    group: 'AI 与算法',
    status: 'merged',
    aliases: [],
    mergedInto: 'd-agent',
  },

  /* —— 分组 2 · 工程与架构 —— */
  { id: 'c-architecture', label: '系统架构', group: '工程与架构', status: 'active', aliases: ['架构'] },
  { id: 'c-backend', label: '后端工程', group: '工程与架构', status: 'active', aliases: [] },
  { id: 'c-frontend', label: '前端工程', group: '工程与架构', status: 'active', aliases: [] },
  { id: 'c-perf', label: '性能优化', group: '工程与架构', status: 'active', aliases: ['性能', '前端'] },
  { id: 'c-reliability', label: '可靠性设计', group: '工程与架构', status: 'active', aliases: ['可靠性'] },
  { id: 'c-testing', label: '测试与质量', group: '工程与架构', status: 'active', aliases: ['测试'] },
  { id: 'c-code-review', label: '代码评审', group: '工程与架构', status: 'active', aliases: [] },
  { id: 'c-security-eng', label: '安全工程', group: '工程与架构', status: 'active', aliases: [] },
  { id: 'd-cicd', label: 'CI/CD 流水线', group: '工程与架构', status: 'active', aliases: [] },
  { id: 'd-observability', label: '可观测性', group: '工程与架构', status: 'active', aliases: ['监控'] },
  { id: 'd-stability', label: '稳定性工程', group: '工程与架构', status: 'active', aliases: ['稳定性'] },
  { id: 'd-gateway', label: 'API 网关', group: '工程与架构', status: 'active', aliases: [] },
  { id: 'd-config', label: '配置与发布', group: '工程与架构', status: 'active', aliases: [] },
  { id: 'd-grafana', label: 'Grafana 看板', group: '工程与架构', status: 'active', aliases: ['Grafana'] },

  /* —— 分组 2 · 历史标签（已停用）—— */
  {
    id: 'c-fullstack',
    label: '全栈开发',
    group: '工程与架构',
    status: 'deprecated',
    aliases: [],
  },

  /* —— 分组 3 · 数据与分析 —— */
  { id: 'd-dataplatform', label: '数据平台', group: '数据与分析', status: 'active', aliases: ['数据'] },
  { id: 'd-tracking', label: '埋点', group: '数据与分析', status: 'active', aliases: ['埋点规范'] },
  { id: 'd-metrics', label: '指标体系', group: '数据与分析', status: 'active', aliases: [] },
  { id: 'd-realtime', label: '实时计算', group: '数据与分析', status: 'active', aliases: [] },
  { id: 'd-warehouse', label: '数据仓库', group: '数据与分析', status: 'active', aliases: [] },
  { id: 'd-bi', label: '经营看板', group: '数据与分析', status: 'active', aliases: ['BI'] },
  { id: 'd-experiment', label: 'A/B 实验平台', group: '数据与分析', status: 'active', aliases: ['实验'] },
  { id: 'd-dataquality', label: '数据质量', group: '数据与分析', status: 'active', aliases: [] },
  { id: 'c-data-eng', label: '数据工程', group: '数据与分析', status: 'active', aliases: ['数据工程'] },
  { id: 'c-analytics', label: '数据分析', group: '数据与分析', status: 'active', aliases: ['数据分析'] },
  { id: 'c-modeling', label: '数据建模', group: '数据与分析', status: 'active', aliases: [] },

  /* —— 分组 3 · 历史标签（已合并 → d-metrics）—— */
  {
    id: 'c-metrics-design',
    label: '指标设计',
    group: '数据与分析',
    status: 'merged',
    aliases: [],
    mergedInto: 'd-metrics',
  },

  /* —— 分组 4 · 产品与设计 —— */
  { id: 'c-product', label: '产品设计', group: '产品与设计', status: 'active', aliases: ['产品'] },
  { id: 'c-ux', label: '交互设计', group: '产品与设计', status: 'active', aliases: ['设计'] },
  { id: 'c-research', label: '用户研究', group: '产品与设计', status: 'active', aliases: [] },
  { id: 'c-spec', label: '规范制定', group: '产品与设计', status: 'active', aliases: [] },
  { id: 'c-content', label: '内容撰写', group: '产品与设计', status: 'active', aliases: [] },
  { id: 'c-visual', label: '视觉表达', group: '产品与设计', status: 'active', aliases: [] },

  /* —— 分组 5 · 业务与场景 —— */
  { id: 'd-pos', label: '门店 POS', group: '业务与场景', status: 'active', aliases: ['POS'] },
  { id: 'd-selfcheckout', label: '自助结账', group: '业务与场景', status: 'active', aliases: [] },
  { id: 'd-esl', label: '电子价签', group: '业务与场景', status: 'active', aliases: ['价签', '设备'] },
  { id: 'd-member', label: '会员增长', group: '业务与场景', status: 'active', aliases: ['会员'] },
  { id: 'd-points', label: '会员积分', group: '业务与场景', status: 'active', aliases: ['积分'] },
  { id: 'd-miniapp', label: '会员小程序', group: '业务与场景', status: 'active', aliases: ['小程序'] },
  { id: 'd-ecommerce', label: '线上商城', group: '业务与场景', status: 'active', aliases: ['电商', '电商平台'] },
  { id: 'd-promo', label: '促销与优惠', group: '业务与场景', status: 'active', aliases: ['促销', '交易'] },
  { id: 'd-supply', label: '供应链数字化', group: '业务与场景', status: 'active', aliases: ['供应链', '库存'] },
  { id: 'd-store', label: '门店数字化', group: '业务与场景', status: 'active', aliases: ['门店'] },
  { id: 'd-app', label: '迪卡侬 App', group: '业务与场景', status: 'active', aliases: ['App'] },
  { id: 'd-crm', label: '会员与 CRM', group: '业务与场景', status: 'active', aliases: ['CRM'] },
  { id: 'd-order', label: '订单与履约', group: '业务与场景', status: 'active', aliases: ['订单'] },

  /* —— 分组 5 · 历史标签（已合并 → d-supply）—— */
  {
    id: 'd-replenish',
    label: '智能补货',
    group: '业务与场景',
    status: 'merged',
    aliases: ['补货'],
    mergedInto: 'd-supply',
  },

  /* —— 分组 6 · 平台与安全 —— */
  { id: 'd-sso', label: 'SSO 统一身份', group: '平台与安全', status: 'active', aliases: ['SSO', '平台'] },
  { id: 'd-security', label: '安全与合规', group: '平台与安全', status: 'active', aliases: ['安全', '合规', '权限', '审计'] },
  { id: 'd-cloudnative', label: '云原生', group: '平台与安全', status: 'active', aliases: [] },

  /* —— 分组 7 · 协作与流程 —— */
  { id: 'd-demand', label: '需求管理', group: '协作与流程', status: 'active', aliases: ['流程'] },
  { id: 'd-docs', label: '知识沉淀', group: '协作与流程', status: 'active', aliases: [] },
  { id: 'd-collab', label: '跨部门协同', group: '协作与流程', status: 'active', aliases: [] },
  { id: 'd-design-system', label: '设计系统', group: '协作与流程', status: 'active', aliases: ['设计规范', '设计令牌'] },
  { id: 'd-onboarding', label: '新人上手', group: '协作与流程', status: 'active', aliases: [] },
  { id: 'd-ops-process', label: '研发流程', group: '协作与流程', status: 'active', aliases: [] },
  { id: 'd-content-ops', label: '内容运营', group: '协作与流程', status: 'active', aliases: ['门户内容', '公告'] },
  { id: 'd-portal', label: '内部门户', group: '协作与流程', status: 'active', aliases: [] },
  { id: 'c-planning', label: '需求拆解与排期', group: '协作与流程', status: 'active', aliases: [] },
  { id: 'c-milestone', label: '里程碑管理', group: '协作与流程', status: 'active', aliases: [] },
  { id: 'c-cross-team', label: '跨团队协同', group: '协作与流程', status: 'active', aliases: [] },
  { id: 'c-mentoring', label: '带人与分享', group: '协作与流程', status: 'active', aliases: [] },
  { id: 'c-stakeholder', label: '干系人沟通', group: '协作与流程', status: 'active', aliases: [] },
];

/** 词表索引：id → 定义 */
export const TAG_BY_ID = TAG_DICT.reduce((m, t) => {
  m[t.id] = t;
  return m;
}, {});

/**
 * ALIAS_TO_TAG —— label / aliases → tagId 的反查表（唯一事实来源）。
 * collectEvidence 与组织速查表（Workspace.jsx）共用同一张表，
 * 保证「贡献条目归类」与「成员标签展示」用同一套词表解析口径。
 */
const ALIAS_TO_TAG = TAG_DICT.reduce((m, t) => {
  m[t.label] = t.id;
  (t.aliases || []).forEach((a) => {
    m[a] = t.id;
  });
  return m;
}, {});

/**
 * resolveTagId(word) —— 把自由字符串（如 '设计规范'、'设备'）解析为词表标签 id。
 * 命中返回 id，未命中返回 null。**绝不返回词表外裸字符串**（规范 §1.5 R1 纪律）。
 */
export function resolveTagId(word) {
  const hit = ALIAS_TO_TAG[String(word == null ? '' : word).trim()];
  return hit && TAG_BY_ID[hit] ? hit : null;
}

/**
 * resolveTagIds(words[]) —— 批量解析并按词表顺序去重，返回 tagId 数组。
 * 供组织速查表渲染「系统标签名」用（渲染层再经 TAG_BY_ID 取 label）。
 */
export function resolveTagIds(words) {
  const ids = new Set();
  (words || []).forEach((w) => {
    const id = resolveTagId(w);
    if (id) ids.add(id);
  });
  return Array.from(ids);
}

/**
 * SKILL_GROUPS —— 技能标签树的 7 个一级分组（渲染顺序，不可改）。
 * v0.4.1 单树化：原「双轴」两组表（领域轴 / 能力类型轴）已合并为这一份单一分组表，
 * 旧名不再导出。
 */
export const SKILL_GROUPS = [
  'AI 与算法',
  '工程与架构',
  '数据与分析',
  '产品与设计',
  '业务与场景',
  '平台与安全',
  '协作与流程',
];

/**
 * personId(email) —— 派生人员 id（唯一事实来源）
 * 取 `@` 前前缀、统一小写。路由与搜索索引共用同一函数，保证口径一致。
 * 不给 orgPeople 加 id 字段（避免数据重复与不一致）。
 */
export function personId(email) {
  return String(email || '')
    .split('@')[0]
    .trim()
    .toLowerCase();
}

/** 由 id 反查人（供路由 :id 使用） */
export function personById(id) {
  const key = String(id || '').toLowerCase();
  return orgPeople.find((p) => personId(p.email) === key) || null;
}

/**
 * EVIDENCE_AS_OF —— 实证度时间窗基准日（固定常量）。
 * 不使用运行时真实日期：否则 mock 数据会随时间滑出 12 个月窗口、实证度逐日贬值，
 * 断言无法在任何运行日复现、demo 也会崩坏。
 */
export const EVIDENCE_AS_OF = '2026-09-17';

/** 权重表：最佳实践=3 / 文章=3 / 项目动态=2 / 公告=2 / Release=1 */
export const EVIDENCE_WEIGHTS = {
  bestPractice: 3,
  article: 3,
  projectUpdate: 2,
  announcement: 2,
  release: 1,
};

/**
 * personTags —— 人 × 标签（值恒为 true，仅表示「此人有此标签」）。
 * 遵守上限：合计 ≤9。技能标签仅来自系统数据抽取与人才盘点，无「主标签」概念。
 *
 * v0.4.2：自评轨整体退场（用户「不需要持续关注和公开贡献这个板块」）——值不再承载自评档，
 * 统一改为 true。**保留 key 结构而非改造成数组**：`Object.keys()` 的消费点有 4 处
 * （getPersonProfile / peopleWithTag / TagBrowse 的 PEOPLE_BY_TAG / TagBrowse 结果行），
 * 改结构会牵动 4 处无关改动面，收益为零。true 是零成本的中性占位。
 */
export const personTags = {
  'min.zhou': {
    // 设计系统负责人：标签更新于 2026-09-16
    'd-design-system': true,
    'd-portal': true,
    'd-content-ops': true,
    'd-docs': true,
    'c-spec': true,
    'c-ux': true,
    'c-visual': true,
    'c-product': true,
  },
  'siyuan.chen': {
    'd-member': true,
    'd-points': true,
    'd-miniapp': true,
    'd-crm': true,
    'c-product': true,
    'c-perf': true,
    'c-planning': true,
    'c-analytics': true,
  },
  'wang.lin': {
    'd-pos': true,
    'd-selfcheckout': true,
    'd-store': true,
    'd-order': true,
    'd-esl': true,
    'c-architecture': true,
    'c-reliability': true,
    'c-backend': true,
    // 历史遗留：曾经的「全栈开发」，现已停用 —— 个人页标签矩阵照常渲染（带「已停用」样式，
    // 规范 C.4：历史引用可审计，不静默丢弃）。
    'c-fullstack': true,
  },
  'qian.liu': {
    'd-ecommerce': true,
    'd-promo': true,
    'd-order': true,
    'd-member': true,
    'c-product': true,
    'c-analytics': true,
    'c-research': true,
  },
  'zhiwei.shen': {
    'd-dataplatform': true,
    'd-tracking': true,
    'd-metrics': true,
    'd-realtime': true,
    'd-warehouse': true,
    'c-data-eng': true,
    'c-metrics-design': true,
    'c-modeling': true,
    'c-analytics': true,
  },
  'jia.he': {
    'd-sso': true,
    'd-observability': true,
    'd-stability': true,
    'd-cicd': true,
    'd-grafana': true,
    'c-reliability': true,
    'c-architecture': true,
    'c-security-eng': true,
    'c-cross-team': true,
  },
  'yuan.zheng': {
    'd-supply': true,
    'd-replenish': true,
    'd-warehouse': true,
    'd-order': true,
    'c-architecture': true,
    'c-reliability': true,
    'c-backend': true,
  },
  'tong.wu': {
    'd-esl': true,
    'd-store': true,
    'd-pos': true,
    'd-realtime': true,
    'c-backend': true,
    'c-reliability': true,
    'c-testing': true,
  },
  'yiming.gu': {
    'd-security': true,
    'd-sso': true,
    'd-observability': true,
    'd-demand': true,
    'c-security-eng': true,
    'c-spec': true,
    'c-testing': true,
  },
  'yue.sun': {
    'd-content-ops': true,
    'd-portal': true,
    'd-docs': true,
    'd-design-system': true,
    'd-collab': true,
    'c-content': true,
    'c-ux': true,
    'c-stakeholder': true,
  },
};

/* ---------------------- 证据解算器（D.2 的四步） ---------------------- */

/**
 * 解析 owner/author → 姓名：兼容裸名（「郑远」）与「组 · 姓名」（「会员增长组 · 陈思远」）。
 * 解析结果为空（空串 / 全空白 / 「何嘉 ·」这类分隔符残缺格式）时**返回 null**，
 * 与「未匹配到 orgPeople 名单」（如幽灵贡献者「周立」）走同一条「不计入任何人」的路径——
 * 绝不允许产生空串姓名，否则会伪造出一个孤立/幽灵的个人页 key。
 */
export function parseOwnerName(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  if (s.includes('·')) {
    const parts = s.split('·');
    const name = parts[parts.length - 1].trim();
    return name || null;
  }
  return s;
}

/** 是否落在近 12 个月窗口内（以 EVIDENCE_AS_OF 为「今天」） */
function withinWindow(dateStr) {
  const asOf = new Date(EVIDENCE_AS_OF + 'T00:00:00');
  const d = new Date(String(dateStr || '') + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return false;
  const months = (asOf.getFullYear() - d.getFullYear()) * 12 + (asOf.getMonth() - d.getMonth());
  return months < 12 && d <= asOf;
}

/**
 * 收集全部证据条目（不入个人页，未匹配到人的条目仍保留在部门级列表里）。
 * 每条：{ kind, weight, personName, date, title, summary, path, tagIds[] }
 *   · tagIds 由 category / tags 经 TAG_DICT.aliases 映射到技能标签（单树，命中即计入）。
 *   · bestPractices 与 articles 有重叠条目 → 以 id 去重（优先 article 全文，权重同 3）。
 */
function collectEvidence() {
  const out = [];
  // v0.4.2：别名映射表与解析函数提升为模块级导出的 ALIAS_TO_TAG / resolveTagIds
  // （组织速查表复用同一口径），此处只做调用，不再内联重复一份。
  const mapToTags = (words) => resolveTagIds(words);

  // bestPractices：category 映射。articles 有全文的以 articles 为准（避免重复计分）。
  const articleIds = new Set(Object.keys(articles));
  bestPractices.forEach((b) => {
    if (articleIds.has(b.id)) return; // 去重：交给下面的 articles 循环，避免同一篇计两次
    out.push({
      kind: 'bestPractice',
      weight: EVIDENCE_WEIGHTS.bestPractice,
      personName: parseOwnerName(b.author),
      date: b.updated,
      title: b.title,
      summary: b.summary,
      path: '#/knowledge/article/' + b.id,
      tagIds: mapToTags([b.category]),
    });
  });

  // articles（有全文）：author 为裸名
  Object.values(articles).forEach((a) => {
    const cat = String(a.category || '').split(' / ');
    out.push({
      kind: 'article',
      weight: EVIDENCE_WEIGHTS.article,
      personName: parseOwnerName(a.author),
      date: a.updated,
      title: a.title,
      summary: (a.body && a.body[0] && a.body[0].text) || '',
      path: '#/knowledge/article/' + a.id,
      tagIds: mapToTags([cat[cat.length - 1]]),
    });
  });

  // projectUpdates：「组 · 姓名」需解析
  projectUpdates.forEach((p) => {
    out.push({
      kind: 'projectUpdate',
      weight: EVIDENCE_WEIGHTS.projectUpdate,
      personName: parseOwnerName(p.owner),
      date: p.date,
      title: p.title,
      summary: p.summary,
      path: '#/news',
      tagIds: mapToTags(p.tags),
    });
  });

  // announcements：「组 · 姓名」需解析
  announcements.forEach((a) => {
    out.push({
      kind: 'announcement',
      weight: EVIDENCE_WEIGHTS.announcement,
      personName: parseOwnerName(a.owner),
      date: a.date,
      title: a.title,
      summary: a.summary,
      path: '#/news',
      tagIds: mapToTags(a.tags),
    });
  });

  // releaseNotes：裸名，含幽灵贡献者「周立」（不在 orgPeople 名单内 → 不入任何人）
  // ★ 哑弹守卫（P1-3）：只统计**已发布**的 Release。releaseStatusMap 中只有
  //   status === 'released'（已发布）代表真上线；'gray'（灰度中）/ 'planned'（计划中）
  //   均**不得**计入实证度——否则一条未来日期/未发布的 Release 会凭空抬高他人档位。
  //   判据来源：releaseStatusMap（released→已发布 / gray→灰度中 / planned→计划中），
  //   只有 released 之外一律剔除。
  //   同类排查（P1-3 复审）：announcements / projectUpdates **无 status 字段**
  //   （公告即已发生的事实，不存在「未发布」态），故无需守卫——已逐对象核对字段。
  releaseNotes.forEach((r) => {
    if (r.status !== 'released') return; // 只留已发布
    out.push({
      kind: 'release',
      weight: EVIDENCE_WEIGHTS.release,
      personName: parseOwnerName(r.owner),
      date: r.date,
      title: `${r.system} ${r.version}`,
      summary: r.summary,
      path: '#/news',
      tagIds: mapToTags([r.system]),
    });
  });

  return out;
}

/** 全量证据条目（导出供测试做数据层断言；业务代码请用 getPersonProfile）。 */
export const ALL_EVIDENCE = collectEvidence();

/** 部门级总数（含未匹配到人的证据，方便后续扩展） */
export function departmentEvidenceCount() {
  return ALL_EVIDENCE.length;
}

/* ======================================================================
   v0.4.3 · Jira 近期工作（前瞻数据）
   ----------------------------------------------------------------------
   形态：**独立扁平表 + 按人聚合**，沿用 ALL_EVIDENCE 已验证的先例。
   ⚠️ 关键纪律（避开 ALL_EVIDENCE 的两个坑）：
     用 `assigneeId`（= personId(email 前缀)）做**结构化外键**，**绝不用姓名**。
     ALL_EVIDENCE 用 personName 字符串匹配，已付出「幽灵贡献者周立」
     「『何嘉 ·』分隔符残缺」两个代价；新表从源头杜绝此类错配。
   ⚠️ assigneeId 的取值**全部取自 orgPeople 现有 10 人**，不造新人。
   ====================================================================== */

/**
 * WORK_WINDOW_AS_OF / WORK_WINDOW_END —— 「当前至未来 1 个月」的固定时间窗。
 *
 * 为什么不改 EVIDENCE_AS_OF 本身：它被 12 个月实证窗 withinWindow() 复用，
 *   改它会牵动全部标签档位计算（风险外溢）。两常量**共享同一基准值**即可。
 * 为什么右界写死字符串而非运行时加月份：
 *   new Date('2026-09-17').setMonth(+1) 存在①月末溢出（1-31 加一月 → 3-3）
 *   ②时区解析差异两个经典坑。写死 = 零解析歧义、断言可逐字复现——
 *   与 EVIDENCE_AS_OF 同一哲学（「不可复现」已让本项目栽过三次）。
 */
export const WORK_WINDOW_AS_OF = EVIDENCE_AS_OF; // '2026-09-17'
export const WORK_WINDOW_END = '2026-10-17'; // 写死右界，不用运行时加月份

/**
 * JIRA_ISSUES —— 每条 = 一个 Jira issue（issue 为中心，而非「人的属性」）。
 * 字段：key（单号，兼作 React key）/ title / status / due（'YYYY-MM-DD'）/ project /
 *       priority（选填）/ assigneeId（personId 结构化外键）。
 * status 4 态：'todo' | 'inprogress' | 'review' | 'blocked'（blocked 不上屏，见 ui.jsx WorkStatusPill）。
 *
 * 覆盖：8 人有任务；zhiwei.shen / yiming.gu **特意 0 条**（测空态）。
 * 含 1 条 status:'blocked' 样本；含逾期样本（due < WORK_WINDOW_AS_OF 且未完结）。
 * 全部静态字面量，**无 new Date() / 无 Math.random()**。
 */
export const JIRA_ISSUES = [
  // —— 周敏 min.zhou（设计系统负责人）——
  { key: 'DS-3102', title: '设计令牌 v2 全站迁移与回归', status: 'inprogress', due: '2026-09-22', project: '设计系统', priority: 'P0', assigneeId: 'min.zhou' },
  { key: 'DS-3110', title: '组件库无障碍标注补齐', status: 'review', due: '2026-09-29', project: '设计系统', priority: 'P1', assigneeId: 'min.zhou' },
  { key: 'DS-3125', title: '深色模式令牌映射评审', status: 'todo', due: '2026-10-06', project: '设计系统', priority: 'P2', assigneeId: 'min.zhou' },
  { key: 'DS-3080', title: '图标线性化收尾（面版图标下线）', status: 'inprogress', due: '2026-09-15', project: '设计系统', priority: 'P1', assigneeId: 'min.zhou' }, // 逾期样本
  { key: 'DS-3121', title: '设计规范文档站改版', status: 'blocked', due: '2026-10-09', project: '设计系统', priority: 'P2', assigneeId: 'min.zhou' }, // blocked 样本
  // —— 陈思远 siyuan.chen（会员增长组 · 产品经理）——
  { key: 'MEM-2184', title: '会员积分规则迁移到自然年', status: 'review', due: '2026-10-08', project: '会员中心', priority: 'P0', assigneeId: 'siyuan.chen' },
  { key: 'MEM-2190', title: '小程序会员等级权益改版', status: 'inprogress', due: '2026-09-25', project: '会员小程序', priority: 'P1', assigneeId: 'siyuan.chen' },
  { key: 'MEM-2201', title: 'CRM 人群包同步链路梳理', status: 'todo', due: '2026-10-02', project: '会员中心', priority: 'P2', assigneeId: 'siyuan.chen' },
  { key: 'MEM-2205', title: '积分商城兑换上限策略', status: 'todo', due: '2026-10-14', project: '会员中心', priority: 'P2', assigneeId: 'siyuan.chen' },
  { key: 'MEM-2209', title: '生日礼遇触达文案优化', status: 'inprogress', due: '2026-10-01', project: '会员小程序', priority: 'P1', assigneeId: 'siyuan.chen' },
  { key: 'MEM-2213', title: '会员数据看板口径对齐', status: 'todo', due: '2026-10-16', project: '经营看板', priority: 'P2', assigneeId: 'siyuan.chen' },
  { key: 'MEM-2160', title: '积分过期提醒补偿方案', status: 'inprogress', due: '2026-09-10', project: '会员中心', priority: 'P1', assigneeId: 'siyuan.chen' }, // 逾期样本
  // —— 林望 wang.lin（门店数字化组 · 技术负责人）——
  { key: 'POS-1420', title: 'POS 结算性能优化第二阶段', status: 'inprogress', due: '2026-09-30', project: '门店 POS', priority: 'P0', assigneeId: 'wang.lin' },
  { key: 'POS-1435', title: '自助结账反扫兼容性改造', status: 'review', due: '2026-10-07', project: '自助结账', priority: 'P1', assigneeId: 'wang.lin' },
  { key: 'POS-1441', title: '多门店并发压测脚本', status: 'todo', due: '2026-10-13', project: '门店 POS', priority: 'P2', assigneeId: 'wang.lin' },
  { key: 'POS-1408', title: '离线收银断网续传', status: 'inprogress', due: '2026-09-19', project: '门店 POS', priority: 'P1', assigneeId: 'wang.lin' },
  // —— 刘倩 qian.liu（电商平台组 · 产品经理）——
  { key: 'EC-2260', title: '商城购物车合并结算', status: 'inprogress', due: '2026-09-26', project: '线上商城', priority: 'P0', assigneeId: 'qian.liu' },
  { key: 'EC-2271', title: '大促优惠叠加规则配置化', status: 'review', due: '2026-10-05', project: '促销中心', priority: 'P1', assigneeId: 'qian.liu' },
  { key: 'EC-2280', title: '订单拆单与合单策略', status: 'todo', due: '2026-10-12', project: '线上商城', priority: 'P2', assigneeId: 'qian.liu' },
  // —— 沈知微 zhiwei.shen（数据平台组）：**特意 0 条任务**（空态样本）——
  // —— 何嘉 jia.he（SRE 组）——
  { key: 'SRE-880', title: '监控告警降噪与分级', status: 'inprogress', due: '2026-09-24', project: '可观测平台', priority: 'P0', assigneeId: 'jia.he' },
  { key: 'SRE-892', title: 'SSO 会话续期稳定性治理', status: 'review', due: '2026-10-03', project: 'SSO', priority: 'P1', assigneeId: 'jia.he' },
  { key: 'SRE-901', title: '灰度发布流水线收敛', status: 'todo', due: '2026-10-15', project: 'CI/CD', priority: 'P2', assigneeId: 'jia.he' },
  { key: 'SRE-860', title: '核心链路 SLO 复盘', status: 'inprogress', due: '2026-09-08', project: '可观测平台', priority: 'P1', assigneeId: 'jia.he' }, // 逾期样本
  // —— 郑远 yuan.zheng（供应链数字化组）——
  { key: 'SUP-660', title: '库存周转预测模型上线', status: 'inprogress', due: '2026-09-28', project: '库存与供应链', priority: 'P0', assigneeId: 'yuan.zheng' },
  { key: 'SUP-671', title: '自动补货阈值调优', status: 'review', due: '2026-10-10', project: '库存与供应链', priority: 'P1', assigneeId: 'yuan.zheng' },
  // —— 吴桐 tong.wu（门店数字化组 · 工程师）——
  { key: 'ESL-330', title: '电子价签批量刷新性能', status: 'inprogress', due: '2026-09-27', project: '电子价签', priority: 'P1', assigneeId: 'tong.wu' },
  { key: 'ESL-341', title: '门店设备离线告警补全', status: 'todo', due: '2026-10-11', project: '门店设备', priority: 'P2', assigneeId: 'tong.wu' },
  { key: 'ESL-352', title: '价签模板与端侧缓存', status: 'todo', due: '2026-10-16', project: '电子价签', priority: 'P2', assigneeId: 'tong.wu' },
  // —— 顾一鸣 yiming.gu（安全合规）：**特意 0 条任务**（空态样本）——
  // —— 孙玥 yue.sun（内容运营）——
  { key: 'OPS-455', title: '门户内容运营台改版', status: 'inprogress', due: '2026-09-23', project: '门户内容', priority: 'P1', assigneeId: 'yue.sun' },
  { key: 'OPS-462', title: '部门公告模板规范化', status: 'review', due: '2026-10-04', project: '公告中心', priority: 'P2', assigneeId: 'yue.sun' },
];

/**
 * getPersonWork(personIdOrEmail) —— 「近期工作内容」（前瞻态）。
 * ------------------------------------------------------------------
 * 筛选：① status 未完结（4 态均视为在进行）；② due ∈ [AS_OF, WINDOW_END]。
 *   ★ 逾期未完结的（due < AS_OF）**也返回**，但排在窗口内任务之后
 *     （漏掉逾期在办任务 = 对协作方撒谎；但不让它浮顶 = 不「示众」）。
 * 排序（三级键，保证全序、无随机）：
 *   窗口内 & 逾期两组各自：due 升序 → priority 降序(P0→P2) → key 字典序升序；
 *   逾期组整体排在窗口内组之后。
 * 返回：{ items:[...最多 5], total:n }。每项派生 `overdue` 布尔（口径收口在数据层，
 *   渲染层不自行比较日期字符串）。like 一样「一个函数拿全个人页数据」。
 */
export function getPersonWork(personIdOrEmail) {
  const key = String(personIdOrEmail || '').toLowerCase();
  const P_ORDER = { P0: 0, P1: 1, P2: 2 };
  const rank = (issue) => ({
    ...issue,
    overdue: issue.due < WORK_WINDOW_AS_OF,
  });
  // 未完结 = 全部 4 态（本项目无 'done' 态，故此处即「全部」；显式写守卫以备扩展）。
  const open = JIRA_ISSUES.filter((i) => i.assigneeId === key && i.status !== 'done');
  const inWindow = open.filter((i) => i.due >= WORK_WINDOW_AS_OF && i.due <= WORK_WINDOW_END).map(rank);
  const overdue = open.filter((i) => i.due < WORK_WINDOW_AS_OF).map(rank);

  const sortGroup = (arr) =>
    arr.slice().sort((a, b) => {
      if (a.due !== b.due) return a.due < b.due ? -1 : 1;
      const pa = P_ORDER[a.priority] == null ? 9 : P_ORDER[a.priority];
      const pb = P_ORDER[b.priority] == null ? 9 : P_ORDER[b.priority];
      if (pa !== pb) return pa - pb;
      return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    });

  const ordered = [...sortGroup(inWindow), ...sortGroup(overdue)];
  return { items: ordered.slice(0, 5), total: ordered.length };
}

/** 按加权分 → 档位：0→none / 1–2→emerging / 3–5→established / ≥6→authoritative */
export function tierOfScore(score) {
  if (score <= 0) return 'none';
  if (score <= 2) return 'emerging';
  if (score <= 5) return 'established';
  return 'authoritative';
}

/**
 * baseLikesOf(personId, tagId) —— 标签点赞的确定性基线计数。
 * ------------------------------------------------------------------
 * 纪律：**绝不用 Math.random()**。本项目所有屏幕级断言依赖可复现数字，
 *       随机计数会让断言在任何运行日失效（且本项目已三次栽在「不可复现」上）。
 *
 * 算法：FNV-1a 32 位散列 → 取模 2 → 0 | 1
 *   · 取模 2 的意图：点赞是「稀缺的认可」，不是人气榜。79 个标签实例下
 *     %2 给出 37 个 0 赞 / 42 个 1 赞（v0.4.2 独立复算），0 赞是合法常态
 *     （渲染为「0」），不是空态。
 *   · 若用 %12 之类会产生大量个位数差异，读起来像「人气温差」——
 *     而本项目铁律是「不造跨人横向比较」，故必须限制在极小值域。
 *
 * 确定性验证：同输入两次调用结果一致，且函数体内无 Math.random。
 */
export function baseLikesOf(personId, tagId) {
  const s = String(personId) + '::' + String(tagId);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % 2;
}

/**
 * getPersonProfile —— 个人页 / 反查页共用的查询函数。
 * 返回 { person, tags:[{tag, evidenceTier, recentScore, recentCount,
 *         historicalCount, likes, contributions[]}], contributions[] }
 *   · contributions 每条带 tagIds（供「→ 标签名」联动渲染与闭环验收）
 *   · 幽灵贡献者「周立」未匹配到人 → 不计入任何个人页
 */
export function getPersonProfile(personIdOrEmail) {
  const key = String(personIdOrEmail || '').toLowerCase();
  const person = orgPeople.find((p) => personId(p.email) === key) || null;
  if (!person) return { person: null, tags: [], contributions: [] };

  const mapping = personTags[key] || {};

  // 该人的全部证据条目（近 12 月 + 历史）。
  // 显式排除 parseOwnerName 返回 null（格式残缺/空 owner）的条目——与幽灵贡献者「周立」
  // （人名解析成功但不在 orgPeople 名单内）走同一条「不计入任何人」的路径。
  const mine = ALL_EVIDENCE.filter((e) => e.personName != null && e.personName === person.name);
  const contributions = mine
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((e, i) => ({ ...e, key: `${e.kind}-${i}-${e.title}` }));

  const buildTag = (id) => {
    const tag = TAG_BY_ID[id];
    if (!tag) return null;
    // ★ 状态守卫（P1-4）：deprecated / merged 标签**不参与实证计算**——它们已不是有效标签，
    //   证据度恒为 0（tier='none'）。否则一条恰好带了旧标签别名的贡献会凭空抬高（或伪造）
    //   该标签档位，进而污染个人页。此处把不变量写在**代码**里，而不是依赖「当前没有贡献
    //   映射到旧标签」的数据巧合。
    const isActive = tag.status !== 'deprecated' && tag.status !== 'merged';
    // 该标签喂养的证据 = 该人带此标签映射的条目
    const feeding = contributions.filter((e) => (e.tagIds || []).includes(id));
    const recentFeeding = feeding.filter((e) => withinWindow(e.date));
    // 去重：同一篇（title 相同）只计一次
    const uniq = (arr) => {
      const seen = new Set();
      return arr.filter((e) => {
        if (seen.has(e.title)) return false;
        seen.add(e.title);
        return true;
      });
    };
    const recent = uniq(recentFeeding);
    const historical = uniq(feeding).filter((e) => !withinWindow(e.date));
    const recentScore = isActive ? recent.reduce((s, e) => s + e.weight, 0) : 0;
    const evidenceTier = tierOfScore(recentScore);
    // 已合并标签：补 originLabel（旧名）与展示名（新词 = target 的 label），
    // 供个人页标签矩阵用 TagChip(status='merged') 渲染「原『旧名』」角标（规范 C.4 可审计）。
    let displayTag = tag;
    if (tag.status === 'merged') {
      const target = TAG_BY_ID[tag.mergedInto];
      displayTag = { ...tag, originLabel: tag.label, label: (target && target.label) || tag.label };
    }
    return {
      tag: displayTag,
      evidenceTier,
      recentScore,
      recentCount: recent.length,
      historicalCount: historical.length,
      totalCount: uniq(feeding).length,
      // v0.4.2：点赞基线（确定性散列，值域 {0,1}）——渲染为「0」亦为合法常态。
      likes: baseLikesOf(key, id),
      contributions: feeding,
    };
  };

  // v0.4.2 单树：按 SKILL_GROUPS 的组序排列；组内「系统档位降序 → 词表索引升序」。
  //   原「primary 优先」二级键随主标签概念退场——留一个永远 false 的比较会静默错乱。
  const orderOf = (id) => TAG_DICT.findIndex((t) => t.id === id);
  const groupRank = (g) => {
    const i = SKILL_GROUPS.indexOf(g);
    return i === -1 ? SKILL_GROUPS.length : i;
  };
  const TIER_ORDER = { none: 0, emerging: 1, established: 2, authoritative: 3 };
  const tierRank = (t) => TIER_ORDER[t.evidenceTier] || 0;
  const tags = Object.keys(mapping)
    .map(buildTag)
    .filter(Boolean)
    .sort((a, b) => {
      const ga = groupRank(a.tag.group);
      const gb = groupRank(b.tag.group);
      if (ga !== gb) return ga - gb;
      const td = tierRank(b) - tierRank(a);
      if (td !== 0) return td;
      return orderOf(a.tag.id) - orderOf(b.tag.id);
    });

  return {
    person,
    tags,
    contributions,
    // v0.4.3：近期工作（前瞻态）——「一个函数拿全个人页数据」。
    work: getPersonWork(key),
  };
}

/** 标签 → 懂它的人（反查页：按姓名排序，绝不做实证度排序） */
export function peopleWithTag(tagId) {
  return orgPeople
    .filter((p) => (personTags[personId(p.email)] || {})[tagId])
    .map((p) => p.name);
}

/**
 * ⚠️ 历史遗留（v0.3 重构后已无消费方）：原「工作台 Tabs」已于站点结构重构中移除，
 * 「组织速查」「业务需求」升为一级栏目（#/org、#/demand），工作台退回纯工具导航。
 * 保留数组以防外部引用，但 label 必须指向**现行导航名**，不得再出现已失效的
 * 「工作台 · 需求提交」旧口径。
 */
export const workspaceTabs = [
  { key: 'tools', label: '工具导航' },
  { key: 'org', label: '组织速查' },
  { key: 'demand', label: '业务需求' },
];

export const toolGroups = [
  {
    key: 'monitor',
    label: '监控与可观测',
    tools: [
      {
        key: 'grafana',
        name: 'Grafana 监控看板',
        icon: 'AreaChartOutlined',
        purpose: '核心系统时序指标与自定义面板',
        owner: 'SRE 组 · 何嘉',
        status: 'success',
        statusLabel: '运行中',
        perm: '部门内全员可申请',
      },
      {
        key: 'logs',
        name: '日志检索平台',
        icon: 'FileSearchOutlined',
        purpose: '按 traceId 检索请求链路与异常堆栈',
        owner: 'SRE 组 · 何嘉',
        status: 'success',
        statusLabel: '运行中',
        perm: '部门内全员可申请',
      },
      {
        key: 'alert',
        name: '告警与值班看板',
        icon: 'BellOutlined',
        purpose: '告警认领状态、值班表与升级路径',
        owner: 'SRE 组 · 何嘉',
        status: 'warning',
        statusLabel: '部分降级',
        perm: '需 SRE 审批',
      },
    ],
  },
  {
    key: 'delivery',
    label: '研发与交付',
    tools: [
      {
        key: 'jenkins',
        name: 'Jenkins 流水线',
        icon: 'DeploymentUnitOutlined',
        purpose: '构建与发布流水线，查看构建历史',
        owner: 'SRE 组 · 何嘉',
        status: 'success',
        statusLabel: '运行中',
        perm: '部门内全员可申请',
      },
      {
        key: 'sso',
        name: 'SSO 权限申请',
        icon: 'SafetyCertificateOutlined',
        purpose: '统一身份接入与权限变更申请',
        owner: 'SRE 组 · 何嘉',
        status: 'success',
        statusLabel: '运行中',
        perm: '自助申请',
      },
      {
        key: 'pospre',
        name: 'POS 预发环境',
        icon: 'ExperimentOutlined',
        purpose: '门店 POS 预发环境与测试设备预约',
        owner: '门店数字化组 · 林望',
        status: 'warning',
        statusLabel: '设备紧张',
        perm: '需门店组审批',
      },
    ],
  },
  {
    key: 'business',
    label: '业务运营',
    tools: [
      {
        key: 'cms',
        name: '商城内容后台',
        icon: 'FileTextOutlined',
        purpose: '首页与活动页的内容配置与发布',
        owner: '电商平台组 · 刘倩',
        status: 'success',
        statusLabel: '运行中',
        perm: '需内容运营审批',
      },
      {
        key: 'tracking',
        name: '埋点平台',
        icon: 'RadarChartOutlined',
        purpose: '埋点方案管理、校验与事件字典',
        owner: '数据平台组 · 沈知微',
        status: 'success',
        statusLabel: '运行中',
        perm: '部门内全员可申请',
      },
      {
        key: 'device',
        name: '门店设备管理后台',
        icon: 'ShopOutlined',
        purpose: '自助结账与价签设备状态、固件版本',
        owner: '门店数字化组 · 吴桐',
        status: 'error',
        statusLabel: '维护中',
        perm: '需门店组审批',
      },
    ],
  },
  {
    key: 'data',
    label: '数据与报表',
    tools: [
      {
        key: 'dataplatform',
        name: '数据平台',
        icon: 'DatabaseOutlined',
        purpose: '离线与实时任务的开发调度、血缘查询',
        owner: '数据平台组 · 沈知微',
        status: 'success',
        statusLabel: '运行中',
        perm: '部门内全员可申请',
      },
      {
        key: 'bi',
        name: '经营看板 BI',
        icon: 'PieChartOutlined',
        purpose: '部门级经营指标看板与自助取数',
        owner: '数据平台组 · 沈知微',
        status: 'success',
        statusLabel: '运行中',
        perm: '需数据组审批',
      },
    ],
  },
];

export const orgPeople = [
  { name: '周敏', dept: '设计系统组', role: '设计系统负责人', email: 'min.zhou@digital', location: '上海 · 总部', tags: ['设计规范', '设计令牌'] },
  { name: '陈思远', dept: '会员增长组', role: '产品经理', email: 'siyuan.chen@digital', location: '上海 · 总部', tags: ['会员', '小程序'] },
  { name: '林望', dept: '门店数字化组', role: '技术负责人', email: 'wang.lin@digital', location: '上海 · 总部', tags: ['POS', '自助结账'] },
  { name: '刘倩', dept: '电商平台组', role: '产品经理', email: 'qian.liu@digital', location: '北京', tags: ['线上商城', '促销'] },
  { name: '沈知微', dept: '数据平台组', role: '数据工程负责人', email: 'zhiwei.shen@digital', location: '杭州', tags: ['埋点', '数据平台'] },
  { name: '何嘉', dept: 'SRE 组', role: 'SRE 负责人', email: 'jia.he@digital', location: '上海 · 总部', tags: ['监控', '稳定性', 'SSO'] },
  { name: '郑远', dept: '供应链数字化组', role: '技术负责人', email: 'yuan.zheng@digital', location: '上海 · 总部', tags: ['库存', '补货'] },
  { name: '吴桐', dept: '门店数字化组', role: '工程师', email: 'tong.wu@digital', location: '深圳', tags: ['电子价签', '设备'] },
  { name: '顾一鸣', dept: '安全合规', role: '安全工程师', email: 'yiming.gu@digital', location: '上海 · 总部', tags: ['权限', '审计'] },
  { name: '孙玥', dept: '内容运营', role: '内容运营', email: 'yue.sun@digital', location: '上海 · 总部', tags: ['门户内容', '公告'] },
];

export const demandTypes = [
  { value: 'perm', label: '数据权限 - 只读' },
  { value: 'perm-write', label: '数据权限 - 读写' },
  { value: 'system', label: '系统接入 / 打通' },
  { value: 'feature', label: '功能需求' },
  { value: 'other', label: '其他' },
];

/* —— 两档模板：轻量档（4 字段，不跑评分） / BRD 完整档（8 字段，实时评完整度）——
   受众分流的落地：类 B 工程师走轻量档，最快 4 项即可提交；
   类 A 业务团队走完整档，靠字段引导把「问题」和「方案」拆开。 */
export const demandTracks = {
  light: {
    key: 'light',
    label: '轻量档',
    /** 给业务方看的分流器文案（不用「轻量 / BRD」内部术语） */
    segLabel: '权限 / 其他（4 项）',
    types: ['perm', 'perm-write', 'other'],
    fieldCount: 4,
    committed: '提交后 2 个工作日内回应',
  },
  brd: {
    key: 'brd',
    label: '完整档',
    segLabel: '功能 / 系统（8 项）',
    types: ['feature', 'system'],
    fieldCount: 8,
    committed: '提交后 2 个工作日内由受理人指派',
  },
};

/** 类型 → 档位 */
export function trackOfType(typeValue) {
  if (demandTracks.light.types.includes(typeValue)) return 'light';
  if (demandTracks.brd.types.includes(typeValue)) return 'brd';
  return 'light'; // 兜底：未知类型归轻量档，避免误伤
}

/** 「说不清，帮我定位」——把不确定性变成服务承诺，是合法的必填满足项 */
export const DEMAND_UNSURE = 'unsure';

export const demandSystems = [
  { value: 'pos', label: '门店 POS' },
  { value: 'member', label: '会员中心' },
  { value: 'wms', label: '库存中心' },
  { value: 'data', label: '数据平台' },
  { value: 'cms', label: '商城内容后台' },
  { value: DEMAND_UNSURE, label: '说不清，帮我定位' },
];

/** 三段式影响范围与量级（每组单选——量级是标量，多选会让判定失去意义） */
export const demandScaleOptions = {
  headcount: {
    key: 'headcount',
    label: '影响多少人',
    options: ['3 人以内', '3–20 人', '20–100 人', '100 人以上'],
  },
  frequency: {
    key: 'frequency',
    label: '多频繁',
    options: ['每天', '每周几次', '每月几次', '偶发一次'],
  },
  blocking: {
    key: 'blocking',
    label: '是否阻塞业务',
    options: ['阻塞，业务做不了', '不阻塞，但有干扰', '暂时不影响'],
  },
};

/* —— 打卡规则词表：纯前端规则判定，零 API ——
   D1 的判定逻辑：现状字段「命中现象词」且「未命中命令式方案词」→ 满分。
   出现方案词 → 扣分，并提示把「加个xx」挪到期望结果。 */
export const demandPhenomenonWords = [
  '对不上',
  '不一致',
  '超时',
  '漏',
  '慢',
  '没人知道',
  '不准',
  '重复',
  '失败',
  '缺失',
  '对不齐',
  '查不到',
];

export const demandSolutionWords = ['加个', '做个', '改个', '导出', '新增一个', '给我加', '加一个', '写个', '搞个'];

/** D4 可验证性：命中数字、阈值或「当…时」句式 → 满分；抽象表述 → 半分 */
export const demandVerifiableWords = ['当', '时', '以内', '超过', '少于', '≥', '≤', '秒', '分钟', '小时', '天', '％', '%', '达到'];

/** D5 标题信息量：空话黑名单（命中即 0 分） */
export const demandTitleFluff = ['优化一下', '优化下', '提个需求', '有个需求', '改进一下', '调整一下', '麻烦看看'];

/** 完整档 8 字段定义：控件类型 / 是否必填 / 是否计分 / 人话 placeholder */
export const brdTemplates = {
  brd: [
    {
      key: 'title',
      label: '需求标题',
      control: 'input',
      required: true,
      scored: true,
      min: 12,
      maxLength: 60,
      placeholder: '例如：门店盘点时库存对不上账，希望定位到具体环节',
      hint: '一句话说清「谁在什么场景下遇到什么」，比「优化一下」有用得多',
    },
    {
      key: 'type',
      label: '需求类型',
      control: 'select',
      required: true,
      scored: false,
      hint: '选「功能需求」或「系统接入 / 打通」会走完整档',
    },
    {
      key: 'current',
      label: '现状 / 遇到的问题',
      control: 'textarea',
      rows: 4,
      required: true,
      scored: true,
      min: 20,
      placeholder:
        '例如：门店盘点时对不上账。系统显示的库存和实际货架差 3–5 件，但不知道是入库、调拨还是收银环节漏记的。',
      hint: '描述你遇到的现象就行，先不用想怎么解决',
    },
    {
      key: 'expected',
      label: '期望结果',
      control: 'textarea',
      rows: 3,
      required: true,
      scored: false,
      min: 15,
      placeholder: '例如：能在盘点差异报表里直接看到差异产生的具体环节和时间点。',
      hint: '写「希望达到什么」，而不是「加什么按钮」',
    },
    {
      key: 'scale',
      label: '影响范围与量级',
      control: 'scale',
      required: true,
      scored: true,
      hint: '三组各选一项，点多快就多快',
    },
    {
      key: 'systems',
      label: '涉及系统 / 入口',
      control: 'systems',
      required: true,
      scored: true,
      hint: '可多选；不确定就选「说不清，帮我定位」，我们会帮你找',
    },
    {
      key: 'expectAt',
      label: '期望完成时间',
      control: 'date',
      required: false,
      scored: true,
      hint: '选填。有硬性节点就填，没有就勾「无硬性期限」',
    },
    {
      key: 'acceptance',
      label: '验收 / 成功标准',
      control: 'textarea',
      rows: 3,
      required: false,
      scored: true,
      min: 15,
      placeholder: '例如：当盘点差异报表能按环节列出差异时，视为完成。（写不出可以不填）',
      hint: '选填，写不出可以先跳过。建议句式「当……时，视为完成」',
    },
  ],
  light: [
    {
      key: 'title',
      label: '需求标题',
      control: 'input',
      required: true,
      scored: false,
      maxLength: 60,
      placeholder: '例如：申请库存服务的生产库只读权限',
      hint: '一句话说清要什么',
    },
    {
      key: 'type',
      label: '需求类型',
      control: 'select',
      required: true,
      scored: false,
      hint: '权限类与「其他」走轻量档，不需要填完整 BRD',
    },
    {
      key: 'systems',
      label: '涉及系统 / 库',
      control: 'systems',
      required: true,
      scored: false,
      hint: '可多选；不确定就选「说不清，帮我定位」',
    },
    {
      key: 'purpose',
      label: '用途与期限',
      control: 'textarea',
      rows: 3,
      required: true,
      scored: false,
      min: 10,
      placeholder: '例如：因排查库存差异需要查询近 3 个月的出入库流水，预计使用 1 个月。',
      hint: '写清用来做什么、要用多久（至少 10 字）',
    },
    {
      key: 'contact',
      label: '联系方式',
      control: 'input',
      required: false,
      scored: false,
      placeholder: '企微 / 邮箱（选填，便于处理人联系你）',
      hint: '选填，不计入完整度',
    },
  ],
};

/** 评分维度的人话名与行动提示（命中 / 部分命中 / 未命中三态）
    三态必须分开：none 态复用 partialHint 会给出「偏抽象」这类**无法执行**的提示
    （用户还没写，谈不上抽象），所以 each 维度都要有独立的 emptyHint。 */
export const brdDimensions = {
  D1: {
    key: 'D1',
    name: '问题与方案的分离',
    fullHint: '现状说的是现象，受理人能据此判断该不该做',
    partialHint: '把解决办法挪到「期望结果」，现状里写清现在是什么现象',
    emptyHint: '还没填现状。写「现在是什么现象」就行，不必想解决办法',
  },
  D2: {
    key: 'D2',
    name: '影响范围',
    fullHint: '人数、频率、是否阻塞都给了，受理人好排优先级',
    partialHint: '量级还差几项，把「影响多少人 / 多频繁 / 是否阻塞」补齐',
    emptyHint: '还没选量级。三组各点一项，估个大概就够',
  },
  D3: {
    key: 'D3',
    name: '涉及系统',
    fullHint: '指向了具体系统，可以直接找对应负责人',
    partialHint: '选了「说不清」也没关系，受理人会帮你定位',
    emptyHint: '还没选涉及系统。不确定就选「说不清，帮我定位」',
  },
  D4: {
    key: 'D4',
    name: '验收标准',
    fullHint: '写清了「怎样算完成」，验收时不会扯皮',
    partialHint: '验收标准偏抽象，加一句「当……时，视为完成」会更清楚',
    emptyHint: '还没填验收标准。这一项可以后补，想不到就先跳过',
  },
  D5: {
    key: 'D5',
    name: '标题的指向性',
    fullHint: '标题能看出对象和场景，检索时找得到',
    partialHint: '标题再具体一点，带上「哪个系统 / 哪个环节」',
    emptyHint: '还没填标题。一句话说清「谁在什么场景遇到什么」',
  },
};

/** 完整度总评四档话术——越低的档位越要先肯定 */
export const demandCompletenessCopy = [
  { min: 80, text: '资料齐了，受理人拿到就能直接排期。' },
  { min: 60, text: '主体信息够了。补上{weak}会更快被受理。' },
  { min: 40, text: '已经说清了问题。把{weak}补一句，受理会顺很多。' },
  { min: 0, text: '先写清现状和期望就能提交；{weak}之后再补也可以。' },
];

/* —— BRD agent：脚本化话术（零 LLM、零网络请求）—— */
export const brdPrompts = [
  '我该先写现状还是期望？',
  '量级怎么估？',
  '验收标准写不写？',
  '「说不清」选了会怎样？',
];

export const brdScriptedReplies = [
  {
    match: ['现状', '期望', '先写'],
    text:
      '先写现状，想到哪写到哪，我帮你理。现状里只写「现在是什么现象」（比如对不上、超时、没人知道），解决办法留在「期望结果」里写——受理人要靠现状判断该不该做。',
  },
  {
    match: ['量级', '多少人', '怎么估', '影响范围'],
    text:
      '不用精确。点三组胶囊就行：影响多少人、多频繁、是否阻塞业务。估个大概区间就够，受理人用它是排优先级，不是做考核。',
  },
  {
    match: ['验收', '成功标准', '写不写'],
    text:
      '验收标准是选填的，写不出可以先跳过，不影响提交。如果写得出来，用「当……时，视为完成」这个句式最省事，比如「当盘点差异报表能按环节列出差异时，视为完成」。',
  },
  {
    match: ['说不清', '定位', '不确定'],
    text:
      '「说不清，帮我定位」是合法选项，选了照样能提交。等于让受理人替你找系统，比硬填一个错的系统名更省事。',
  },
  {
    match: ['标题', '怎么起'],
    text:
      '标题写「谁在什么场景下遇到什么」就够，比如「门店盘点时库存对不上账，希望定位到具体环节」。避免「优化一下」这类写法，受理人检索时找不到。',
  },
];

export const brdAgentIntro =
  '我是 BRD 协作助手。你写，我帮你理——只给一条最值得改的建议，不打扰你提交。';

/** 完整度四档时 agent 的话术（协作者语气，先肯定再建议，达标就停） */
export const brdAgentVerdict = {
  high: '资料齐了，我没什么要改的。提交吧。',
  good: '主体信息够了。{weak}补一句会更快被受理。',
  fair: '问题说清楚了。把{weak}补一句，受理会顺很多。',
  low: '先写清现状和期望就能提交；{weak}之后再补也可以。',
};

/* —— 需求数据 ——
   真实感示意内容，含 BRD 完整档与轻量档两类，供公开列表复用（首页取 3 条 / 提交页取 6 条） */
export const demandHistory = [
  {
    id: 'REQ-2026-0921',
    title: '生产库只读权限：库存服务',
    type: '数据权限 - 只读',
    track: 'light',
    status: 'inprogress',
    submitted: '2026-09-16',
    assignee: '顾一鸣',
    note: '待系统负责人确认库范围',
    scope: { systems: ['wms', 'data'], purpose: '排查库存差异，需查询近 3 个月出入库流水，预计使用 1 个月。' },
    completeness: 100,
  },
  {
    id: 'REQ-2026-0918',
    title: '申请接入埋点平台校验能力',
    type: '系统接入 / 打通',
    track: 'brd',
    status: 'done',
    submitted: '2026-09-11',
    assignee: '沈知微',
    note: '已完成配置与联调',
    completeness: 100,
    expectAt: '2026-09-25',
    scope: {
      current:
        '埋点校验目前只能在提测后人工抽查，事件命名与参数缺失往往到数据回流时才发现，返工要等下一个发版窗口（约两周）。',
      expected: '在埋点方案提交阶段就能自动校验命名与参数，不合格的直接标出来，不用等到数据回流。',
      scale: { headcount: '20–100 人', frequency: '每天', blocking: '不阻塞，但有干扰' },
      systems: ['data'],
      acceptance: '当埋点方案在线提交时能自动标出不合规事件，且校验结果可被责任人看到，视为完成。',
    },
  },
  {
    id: 'REQ-2026-0915',
    title: '价签批量刷新失败告警细化到门店',
    type: '功能需求',
    track: 'brd',
    status: 'pending',
    submitted: '2026-09-09',
    assignee: '吴桐',
    note: '已进入需求池，待排期',
    completeness: 79,
    scope: {
      current:
        '价签批量刷新偶尔失败，但告警只报到区域级，看不到具体是哪家门店、哪批价签，门店反馈问题后要人工逐个排查。',
      expected: '告警里直接带上门店名称与失败的价签批次，方便值班同学一眼定位到店。',
      scale: { headcount: '3–20 人', frequency: '每周几次', blocking: '不阻塞，但有干扰' },
      systems: ['pos'],
    },
  },
  {
    id: 'REQ-2026-0912',
    title: '线上商城搜索排序策略调整',
    type: '功能需求',
    track: 'brd',
    status: 'inprogress',
    submitted: '2026-09-05',
    assignee: '刘倩',
    note: 'UAT 阶段',
    completeness: 92,
    expectAt: '2026-10-15',
    scope: {
      current:
        '搜索结果里缺货商品仍排在前列，用户点进去才能发现有货没货，跳出率在搜索页偏高，运营侧能明显看到这个现象。',
      expected: '有货商品优先展示，缺货的排到后面并标注「补货中」，用户不用逐个点开确认。',
      scale: { headcount: '100 人以上', frequency: '每天', blocking: '不阻塞，但有干扰' },
      systems: ['cms'],
      acceptance: '当搜索列表中缺货商品被置底并带「补货中」标记时，视为完成。',
    },
  },
  {
    id: 'REQ-2026-0908',
    title: '会员小程序积分到期提醒文案与入口优化',
    type: '功能需求',
    track: 'brd',
    status: 'done',
    submitted: '2026-08-29',
    assignee: '陈思远',
    note: '随 v2.8.0 一并发布',
    completeness: 95,
    expectAt: '无硬性期限',
    scope: {
      current:
        '积分临近到期时，小程序只在会员页里放一行灰字，绝大多数会员根本不知道自己的积分要过期，客服最近常接到相关咨询。',
      expected: '在积分到期前 30 天与 7 天各给一次站内提醒，提醒里直接带上即将过期的积分数额。',
      scale: { headcount: '100 人以上', frequency: '每月几次', blocking: '不阻塞，但有干扰' },
      systems: ['member'],
      acceptance: '当会员在积分到期前收到两次提醒、且提醒中能看到过期积分数量时，视为完成。',
    },
  },
  {
    id: 'REQ-2026-0905',
    title: '申请数据平台经营看板的只读账号',
    type: '数据权限 - 只读',
    track: 'light',
    status: 'done',
    submitted: '2026-08-26',
    assignee: '沈知微',
    note: '已开通，有效期 90 天',
    completeness: 100,
    scope: {
      systems: ['data'],
      purpose: '门店月度复盘需要看经营看板，供团队 4 人使用，预计长期使用、按季度续期。',
    },
  },
];

export const demandStatusMap = {
  pending: { label: '待处理', semantic: 'neutral' },
  inprogress: { label: '进行中', semantic: 'info' },
  done: { label: '已完成', semantic: 'success' },
};

/** 首页入口区块文案（服务台语气） */
export const demandEntryCopy = {
  sectionDesc: '内部系统与数据需求的统一入口',
  headline: '有需求，从这里提交',
  promise: '提交后 2 个工作日内由受理人回应并指派，进度在提交页实时可见。',
  primaryCta: '提交需求',
  // P1-2：原文案「先看提交指引」却跳 #/demand（公开列表）—— 文案与落点不符。
  // 站内没有独立的「提交指引」承载页，故改为与真实落点一致的服务台语气；
  // 指向公开列表（别人提了什么、处理到哪一步），语义与目标页严格对应。
  secondaryCta: '先看看别人提了什么',
  listTitle: '最近提交',
  listDesc: '别人提了什么、处理到哪一步',
};

/** 状态摘要（首页大卡用） */
export function demandStats(rows) {
  return {
    pending: rows.filter((r) => r.status === 'pending').length,
    inprogress: rows.filter((r) => r.status === 'inprogress').length,
    done: rows.filter((r) => r.status === 'done').length,
  };
}

export const releaseStatusMap = {
  released: { label: '已发布', semantic: 'success' },
  gray: { label: '灰度中', semantic: 'warning' },
  planned: { label: '计划中', semantic: 'info' },
};

// 变更类型是「分类」，不是「状态」——不占用语义色。
// 否则「修复」被涂成警示橙、读起来像故障，「性能」涂绿又和「已发布」撞色。
// 语义色只留给同一张表的「状态」列（已发布 / 灰度中 / 计划中）。
export const releaseTypeMap = {
  feat: { label: '新功能', semantic: 'neutral' },
  fix: { label: '修复', semantic: 'neutral' },
  perf: { label: '性能', semantic: 'neutral' },
};

/* ======================= Agent for Digital（脚本化回复）======================= */

/** 反馈意图（最高优先级，必须先于其他 match 命中）—— 02b §C.1
 *
 *  ⚠️ 这张词表是「无条件抢先」的：命中即返回反馈动作，不再走知识问答。
 *  因此**每个词都必须表达「对门户本身的意见」这个意图**，不能只是话题词。
 *
 *  实测纠正（本轮）：原先收录的裸词 `问题` / `建议` / `找不到` / `缺失` 会**劫持正常提问**：
 *    ·「SSO 接入有什么常见问题？」 → 被判为反馈，不再回答四步接入流程
 *    ·「库存对不上账是什么问题」   → 被判为反馈，尽管有专门的库存一致性应答
 *    ·「这个页面导航有点乱」       → 反而**漏检**，落到兜底回复（真实反馈却无处登记）
 *  改法：把裸词换成语境词（必须带「这个页面 / 门户 / 网站 / 用起来」等指向门户的限定），
 *  并补上用户真实会说的说法（「有点乱 / 不好找 / 提个反馈」）。
 *  宁可漏检（有兜底文案与显式提问入口），绝不错检（会把知识问答答错）。
 */
export const agentFeedbacksIntent = {
  match: [
    // 明确指向「我在提意见」的表达
    '反馈',
    '提个建议',
    '提建议',
    '提个意见',
    '我想提',
    '吐槽',
    '优化建议',
    // 指向门户本身的体验描述（带限定，避免吃掉知识提问）
    '这个页面',
    '这个网站',
    '这个门户',
    '门户本身',
    '页面有点',
    '有点乱',
    '不好找',
    '不太好找',
    '用起来',
    '改一下',
    '改进一下',
    '能不能加',
    '希望能加',
    // 缺陷类（保留，但要带门户指代，否则「bug」可能指业务系统缺陷）
    '门户的 bug',
    '页面的 bug',
    '这里有个 bug',
  ],
  // 命中后返回特殊动作型回复（不是纯文本）
  kind: 'feedback',
};

/** 反馈类型四选项（沿用原 TopBar Modal 的四项，一字不改） */
export const feedbackKinds = [
  { value: 'ia', label: '信息架构 / 导航' },
  { value: 'content', label: '内容缺失 / 更新' },
  { value: 'ui', label: '显示或交互问题' },
  { value: 'idea', label: '新功能建议' },
];

export const agentReplies = [
  {
    match: ['sso', '单点', '统一身份'],
    text:
      '新系统接入 SSO 分四步：① 提交接入申请（系统标识 + 回调地址）；② 平台组发放客户端配置并联调；③ 灰度验证登录与登出；④ 验收归档。完整流程见知识中心《新系统接入 SSO 的标准流程》；在顶部导航「业务需求」里点「新增需求」提交，类型选「系统接入 / 打通」。',
  },
  {
    match: ['权限', '只读', '数据库'],
    text:
      '生产库只读权限在顶部导航「业务需求」里点「新增需求」提交，类型选「数据权限 - 只读」，填写系统名、库名、用途与期限。这几个字段在轻量档里就够了，审批人为系统负责人 + 安全合规，通常 1 个工作日内完成，默认有效期 90 天。',
  },
  {
    match: ['首屏', '小程序', '性能'],
    text:
      '小程序首屏按「框架启动 → 主包加载 → 首屏数据 → 首屏渲染」四段设预算：主包 ≤ 1.2MB、首屏接口合并后 ≤ 2 个、可交互时间 ≤ 1.8s（中端机型）。细节见《小程序首屏性能优化实践》。',
  },
  {
    match: ['库存', '扣减', '超卖', '一致性'],
    text:
      '库存扣减采用「预占 → 确认 → 超时释放」三段式，幂等键用「订单号 + 变更类型」而非请求 ID。压测结论与容量建议见《大促期间库存扣减的一致性处理》。',
  },
  {
    match: ['告警', '值班', 'oncall', '故障'],
    text:
      '告警认领、值班表与升级路径在「监控运营」页的下钻卡里可以一键跳到告警与值班看板；如果是需要看时序明细的问题，建议直接去 Grafana。',
  },
];

export const agentFallback =
  '我目前是原型内的脚本化助手，还没有接入真实知识库。你可以先去「知识中心 · FAQ」搜索，或在「待补知识」里登记这个问题。已识别的常见问题我也可以直接回答：SSO 接入、权限申请、小程序首屏优化、库存一致性、告警值班。对门户本身的意见或建议，直接告诉我就行，我帮你登记成反馈。';
