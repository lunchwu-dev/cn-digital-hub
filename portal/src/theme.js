/**
 * 设计系统：Decathlon Digital Design Tokens
 * ------------------------------------------------------------------
 * 事实来源：outputs/01b-decathlon-cn-visual-spec.md（decathlon.com.cn 生产站点实测）
 *   主色 #3643BA（2024 重塑新蓝）· 品牌墨色 #000F17 · 次强调黄 #FFCD4E
 * 唯一事实来源原则：组件里不得出现硬编码色值，一律 `const c = useT()` 后取 c.xxx。
 */
import { theme } from 'antd';

/** 全量设计令牌（静态常量） */
export const TOKENS = {
  // —— 品牌与结构色 ——
  brand: '#3643BA',
  brandHover: '#2C3799',
  brandActive: '#232C7E',
  brandSubtle: '#EEF0FB',
  brandBorder: '#C3C9F0',

  // —— 文本 ——
  ink: '#000F17', // 品牌墨色：标题与正文主色
  text2: '#616161', // 次级文本
  text3: '#667085', // 三级文本（合规派生 4.9:1）
  textDisabled: '#B3B7B9', // 仅禁用态 / 装饰，绝不做正文

  // —— 面层与边框 ——
  page: '#F5F4F5', // 页面底
  surface: '#FFFFFF', // 内容面
  border: '#E1E0DF', // 默认边框
  borderStrong: '#D9DDE1', // 强边框
  grid: '#ECEEF0', // 图表网格线

  // —— 强调与警示 ——
  yellow: '#FFCD4E', // 仅小面积标记（置顶 / 里程碑 / NEW）
  danger: '#E3262F',

  // —— 语义四件套（浅底深字细描边）——
  success: '#1E8E4E',
  successText: '#0F6B39',
  successBg: '#E9F7EF',
  successBorder: '#A8DFC0',
  warning: '#E8890C',
  warningText: '#8A5200',
  warningBg: '#FEF4E6',
  warningBorder: '#F6CE93',
  error: '#E3262F',
  errorText: '#B0151D',
  errorBg: '#FDECED',
  errorBorder: '#F4B9BC',
  info: '#1C7ED6',
  infoText: '#0B5AA6',
  infoBg: '#E8F3FD',
  infoBorder: '#A9D2F5',

  // —— 深色顶栏（#000F17 面积色）——
  darkBg: '#000F17',
  darkText1: '#FFFFFF',
  darkText2: '#C7CBD1',
  darkText3: '#8A9099',
  darkHoverBg: 'rgba(255,255,255,.08)',
  darkDivider: 'rgba(255,255,255,.10)',
  darkSearchBg: 'rgba(255,255,255,.08)',
  darkSearchBorder: 'rgba(255,255,255,.14)',

  // —— 图表分类色板（8 色）——
  chart: ['#3643BA', '#1C7ED6', '#12A594', '#2F9E44', '#F08C00', '#E8590C', '#C2255C', '#868E96'],

  // —— 标签体系 / 成熟度专用（单色阶 + 中性，零新色相）——
  // 实证度 4 档 = 品牌蓝的 4 级深浅阶（单色阶），坚决不做红黄绿：
  //   红黄绿是「红绿灯隐喻」，天然携带绩效评价意味，与「禁止跨人比较」正面冲突。
  // brandStep1/2/3 是 brand 家族的中间阶；最高档直接复用 brand（不再派生更深，
  //   因为 brandHover/brandActive 是交互态专用，挪作静态数据语义会与「鼠标悬停」混淆）。
  brandStep1: '#DCE0F4', // 实证度 none 档填充 + 已选 chip 加深底
  brandStep2: '#A9B2E6', // 实证度 emerging
  brandStep3: '#6B78D4', // 实证度 established
  cardHeadBg: '#FAFAFA', // TagMatrix 分区标题条底（比 surface 深一档、比 page 浅一档）
  dashedBorder: '#C9CCCE', // 吹牛态虚线描边 + 已停用 chip 描边

  // —— 阴影（两档，投影色用品牌墨色）——
  shadowRaised: '0 1px 2px rgba(0,15,23,.06), 0 1px 3px rgba(0,15,23,.10)',
  shadowFloating: '0 8px 24px rgba(0,15,23,.14), 0 2px 6px rgba(0,15,23,.06)',

  // —— 形状 ——
  radiusPill: 999,
  radiusCard: 8,
  radiusControl: 6,
  radiusOverlay: 12,

  // —— 间距（8pt 栅格）——
  space: { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, xxl: 48, huge: 64 },

  // —— 字体栈 ——
  fontSans:
    'Roboto, -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", Arial, sans-serif',
  fontMono: '"Roboto Mono", "JetBrains Mono", Menlo, Consolas, monospace',
};

/** 语义 → 浅底胶囊映射表（供状态徽标使用） */
export const SEMANTIC = {
  success: { bg: TOKENS.successBg, border: TOKENS.successBorder, color: TOKENS.successText },
  warning: { bg: TOKENS.warningBg, border: TOKENS.warningBorder, color: TOKENS.warningText },
  error: { bg: TOKENS.errorBg, border: TOKENS.errorBorder, color: TOKENS.errorText },
  info: { bg: TOKENS.infoBg, border: TOKENS.infoBorder, color: TOKENS.infoText },
  neutral: { bg: TOKENS.page, border: TOKENS.border, color: TOKENS.text2 },
};

/** antd ConfigProvider 主题 */
export const decathlonDigitalTheme = {
  cssVar: false,
  token: {
    colorPrimary: TOKENS.brand,
    colorPrimaryHover: TOKENS.brandHover,
    colorPrimaryActive: TOKENS.brandActive,
    colorPrimaryBg: TOKENS.brandSubtle,
    colorPrimaryBorder: TOKENS.brandBorder,
    colorLink: TOKENS.brand,
    colorLinkHover: TOKENS.brandHover,

    colorText: TOKENS.ink,
    colorTextSecondary: TOKENS.text2,
    colorTextTertiary: TOKENS.text3,
    colorTextQuaternary: TOKENS.textDisabled,
    colorTextHeading: TOKENS.ink,

    colorBgLayout: TOKENS.page,
    colorBgContainer: TOKENS.surface,
    colorBgElevated: TOKENS.surface,
    colorBorder: TOKENS.borderStrong,
    colorBorderSecondary: TOKENS.border,
    colorSplit: TOKENS.border,

    colorSuccess: TOKENS.success,
    colorWarning: TOKENS.warning,
    colorError: TOKENS.error,
    colorInfo: TOKENS.info,

    fontFamily: TOKENS.fontSans,
    fontSize: 14,
    borderRadius: TOKENS.radiusControl,
    borderRadiusLG: TOKENS.radiusCard,
    borderRadiusSM: TOKENS.radiusControl,

    boxShadow: TOKENS.shadowRaised,
    boxShadowSecondary: TOKENS.shadowFloating,

    controlHeight: 34,
    wireframe: false,
  },
  components: {
    Layout: { headerBg: TOKENS.darkBg, bodyBg: TOKENS.page },
    Table: {
      headerBg: TOKENS.page,
      headerColor: TOKENS.text2,
      rowHoverBg: TOKENS.page,
      borderColor: TOKENS.border,
      cellPaddingBlock: 12,
    },
    Tabs: { itemSelectedColor: TOKENS.brand, inkBarColor: TOKENS.brand, titleFontSize: 14 },
    Card: { headerFontSize: 16, headerHeight: 48 },
    // 卡片静止态只有 1px 边框，无阴影；仅 hover 抬升（在 global.css 内实现）
    Button: { primaryShadow: 'none', defaultShadow: 'none', fontWeight: 500 },
    Segmented: { itemSelectedBg: TOKENS.surface, itemSelectedColor: TOKENS.brand },
    Modal: { borderRadiusLG: TOKENS.radiusOverlay },
    Drawer: { colorBgElevated: TOKENS.surface },
    Tooltip: { colorBgSpotlight: TOKENS.darkBg },
    Breadcrumb: { itemColor: TOKENS.text3, lastItemColor: TOKENS.ink },
    Menu: { darkItemBg: TOKENS.darkBg },
  },
};

/**
 * 语义别名派生：在 antd live token 之上叠加本项目令牌。
 * 组件里一律 `const c = useT()`，禁止硬编码色值。
 */
export function useT() {
  const { token } = theme.useToken();
  return {
    ...TOKENS,
    // 跟随 antd 实时 token（主题一旦切换这几项会同步变化）
    brandLive: token.colorPrimary,
    inkLive: token.colorText,
    surfaceLive: token.colorBgContainer,
    pageLive: token.colorBgLayout,
    borderLive: token.colorBorder,
    splitLive: token.colorSplit,
    white: token.colorWhite,
    radius: token.borderRadius,
    radiusLG: token.borderRadiusLG,
  };
}
