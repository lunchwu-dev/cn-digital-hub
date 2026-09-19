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
      '在工作台的「需求提交」中提交权限申请，选择「数据权限 - 只读」类型，填写系统名与库名、用途与期限。审批人为该系统负责人与安全合规，一般 1 个工作日内完成。权限默认有效期 90 天，到期需重新申请。',
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

export const workspaceTabs = [
  { key: 'tools', label: '工具导航' },
  { key: 'org', label: '组织速查' },
  { key: 'demand', label: '需求提交' },
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

export const demandHistory = [
  {
    id: 'REQ-2026-0921',
    title: '生产库只读权限：库存服务',
    type: '数据权限 - 只读',
    status: 'inprogress',
    submitted: '2026-09-16',
    assignee: '顾一鸣',
    note: '待系统负责人确认库范围',
  },
  {
    id: 'REQ-2026-0918',
    title: '申请接入埋点平台校验能力',
    type: '系统接入 / 打通',
    status: 'done',
    submitted: '2026-09-11',
    assignee: '沈知微',
    note: '已完成配置与联调',
  },
  {
    id: 'REQ-2026-0915',
    title: '价签批量刷新失败告警细化到门店',
    type: '功能需求',
    status: 'pending',
    submitted: '2026-09-09',
    assignee: '吴桐',
    note: '已进入需求池，待排期',
  },
  {
    id: 'REQ-2026-0912',
    title: '线上商城搜索排序策略调整',
    type: '功能需求',
    status: 'inprogress',
    submitted: '2026-09-05',
    assignee: '刘倩',
    note: 'UAT 阶段',
  },
];

export const demandStatusMap = {
  pending: { label: '待处理', semantic: 'neutral' },
  inprogress: { label: '进行中', semantic: 'info' },
  done: { label: '已完成', semantic: 'success' },
};

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

export const agentReplies = [
  {
    match: ['sso', '单点', '统一身份'],
    text:
      '新系统接入 SSO 分四步：① 提交接入申请（系统标识 + 回调地址）；② 平台组发放客户端配置并联调；③ 灰度验证登录与登出；④ 验收归档。完整流程见知识中心《新系统接入 SSO 的标准流程》，申请入口在工作台「需求提交」。',
  },
  {
    match: ['权限', '只读', '数据库'],
    text:
      '生产库只读权限请到工作台「需求提交」提交，类型选「数据权限 - 只读」，填写系统名、库名、用途与期限。审批人为系统负责人 + 安全合规，通常 1 个工作日内完成，默认有效期 90 天。',
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
  '我目前是原型内的脚本化助手，还没有接入真实知识库。你可以先去「知识中心 · FAQ」搜索，或在「待补知识」里登记这个问题。已识别的常见问题我也可以直接回答：SSO 接入、权限申请、小程序首屏优化、库存一致性、告警值班。';
