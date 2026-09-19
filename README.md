# Decathlon China Digital · 部门数字门户（公告栏）

> 面向迪卡侬中国 Digital 部门（50–200 人）的内部 Web 门户**产品方案 + 可交互高保真原型**。
> 本仓库为 **v0.1 方案原型**，数据全部为示意数据，不连接任何真实系统。

[![version](https://img.shields.io/badge/version-v0.1-3643BA)](https://github.com/lunchwu-dev/github/releases/tag/v0.1)

---

## 30 秒上手

```
双击 outputs/Decathlon-Digital-Portal-v1.0.zip 解压后
  └─ portal/index.html   ← 双击它
```

不用装依赖、不用起服务、不用联网。整个原型是一个离线自包含的 HTML。

两种查看方式：

| 方式 | 入口 |
|------|------|
| 本地打开（推荐，最完整） | 解压 zip → 双击 `portal/index.html` |
| 在线预览 | https://digital-dept-portal.app.workbuddy.host/ |
| 源码开发 | `cd portal && npm install && npm run dev` |

> 新人请先读 [`outputs/00-START-HERE.md`](outputs/00-START-HERE.md)（收件人视角入口，说明能点哪里、数据是不是真的）。

---

## 这个门户要解决什么

部门内部的三个痛点：

1. **重要决议与高时效信息离散**，强依赖即时消息和邮件 → 事情发过就忘
2. **常用工具、系统查找困难** → 每次都要问人
3. **部门知识、最佳实践缺少沉淀** → 新人上手慢

方案的核心判断：**门户的竞争对手不是 IM，是遗忘。**
因此设计重点不在"堆信息模块"，而在**让每条信息都有人负责、有生命周期、过期会被清理**。

---

## 目录结构

```
.
├── outputs/                          # 交付物（文档 + 原型 + 验证）
│   ├── 00-START-HERE.md              # ★ 新手从这里开始
│   ├── 01-benchmark-research.md      # 外部标杆调研（Backstage / Linear / SRE 观测性等）
│   ├── 01b-decathlon-cn-visual-spec.md  # ★ decathlon.com.cn 生产环境实测视觉规范
│   ├── 03-product-solution.md        # ★ 产品方案主文档（九节）
│   ├── 03-product-solution.pdf       # 同上的 PDF 版
│   ├── 04-delivery-notes.md          # ★ 交付说明：设计决策 / 质量报告 / 已知取舍 / 工程教训
│   ├── Decathlon-Digital-Portal-v1.0.zip  # ★ 打包交付物（双击解压即用）
│   ├── _research/                    # 调研与验证脚本（CDP 抓取、断点扫描、变异注入）
│   └── _verify/                      # 独立验证证据（终验日志、截图）
│
└── portal/                           # 原型源码
    ├── src/
    │   ├── theme.js                  # 唯一色源：TOKENS + 语义色 + antd 主题
    │   ├── global.css                # 布局基座、顶栏响应式分档、@font-face
    │   ├── router.js                 # 约 20 行自写 hash 路由（支持 3 段深链）
    │   ├── store.js                  # 容错 localStorage
    │   ├── App.jsx                   # Shell + 水印 + 引导 + 路由分发 + 404 + 页脚披露
    │   ├── components/               # TopBar / GlobalSearch / AgentDrawer / ui / charts / icons
    │   ├── pages/                    # Home / News / Ops / Knowledge / ArticleDetail / Workspace
    │   └── data/mock.js              # 全部示意数据（中文）
    ├── dist/                         # ★ 构建产物，双击可跑（IIFE，无 type=module）
    ├── shots/                        # 17 张验收截图 + report.json
    ├── tests/smoke.cjs               # jsdom 冒烟测试（53 条断言）
    ├── tests/shots.cjs               # CDP 出图 + 响应式断言
    ├── README.md                     # 开发视角文档（含两个响应式陷阱、变异测试）
    └── vite.config.js                # base './' + 离线友好 HTML 插件
```

---

## 技术栈

- **React 18** + **Ant Design 5** + **Vite 5**（不用 React 19，antd 5 需要额外 patch）
- 自写 hash 路由，不引 react-router
- 全部图形为 SVG 手绘，无图表库依赖
- 字体自托管 Latin 子集（Roboto / Roboto Mono woff2），不依赖 CDN

### 离线交付的关键配置

产物要能**双击打开**，必须绕开 `file://` 下的 CORS 限制：

```js
// vite.config.js
base: './',
build: {
  rollupOptions: {
    output: { format: 'iife', inlineDynamicImports: true }
  }
}
// 加上自写插件：剥离构建产物中的 type="module" 与 crossorigin
```

同时用 `ConfigProvider` 注入 antd 主题，配合自定义 `--ds-*` CSS 变量。

---

## 设计系统

品牌层**全部来自 decathlon.com.cn 生产环境实测**（含 2024 品牌重塑后的新蓝），不是凭印象配的：

| 令牌 | 值 | 来源 |
|------|-----|------|
| 主色 | `#3643BA` | 站点实测最强势背景色（36 处） |
| 品牌墨色 | `#000F17` | 站点实测文本主色（294 处） |
| 次级强调 | `#FFCD4E` | 站点实测（10 处） |
| 面 / 边框 | `#F5F4F5` / `#D9DDE1` | 站点实测 |
| 字体 | Roboto + Decathlon Sans | 站点 `@font-face` 双族名注册 |

**一处刻意偏离**：只取品牌色、形状与调性，**拒绝营销页语气**。官网面向消费者，门户面向每天用的同事——同一套视觉，不同说话方式。

**语义色有边界**（规范条款）：红/黄/绿只在「稳定性状态」区集中出现；图表单序列一律品牌蓝，多序列才用分类色板。理由：语义色用滥就会被无视，等真出故障时红色已经不起作用了。

详见 [`outputs/01b-decathlon-cn-visual-spec.md`](outputs/01b-decathlon-cn-visual-spec.md) 与 [`outputs/04-delivery-notes.md`](outputs/04-delivery-notes.md) 第 2 节。

---

## 质量与验证

质量评审：**PASS ｜ 22 / 25**（三维评审流程）

| 维度 | 得分 |
|------|------|
| 设计哲学 | 5 / 5 |
| 信息层次 | 4 / 5 |
| 执行完成度 | 5 / 5 |
| 特异性 | 4 / 5 |
| 克制 | 4 / 5 |

三层验证，全部有可复跑的证据：

1. **jsdom 冒烟测试** — `portal/tests/smoke.cjs`，53 条断言
2. **源码级复验** — `outputs/_verify/reviewer-*.mjs`
3. **CDP 独立终验** — `outputs/_research/leadverify2.mjs`、`foldband.mjs`
   - **1546 档连续宽度扫描，零横向溢出**
   - 顶栏形态带：`360–396 → 141px` / `400–596 → 99px` / `600+ → 61px`
   - 375 / 768 / 1024 / 1280 / 1440 / 1920 六档全 PASS

> **变异测试**：写完断言还要证明断言会红。改构建产物注入缺陷 → 断言必须失败（`EXIT=1`），还原后必须通过（`EXIT=0`）。永远绿的断言比没有断言更危险。

---

## v0.1 的边界（必读）

这是**方案原型**，不是可上线的系统：

- ❌ **所有数据均为示意数据**（页面页脚有明确披露），不连接任何真实系统
- ❌ **无鉴权**，假设内网可见
- ❌ **各项集成未实现**（监控、工单、知识库、Agent 后端全部 mock）
- ⚠️ 顶栏降级分档在 1012px / 1272px 两处余量较薄（19px / 21px），窄档位字体放大后可能溢出，T2 修复处方见交付说明 5.2
- ⚠️ 375px 窄屏无汉堡导航（已决策，见交付说明）
- ⚠️ 字体仅内嵌 Latin 子集，中文回退系统字体
- ⚠️ 图表为静态 SVG，无 tooltip / 交互

完整取舍清单见 [`outputs/04-delivery-notes.md`](outputs/04-delivery-notes.md) 第 5 节。

---

## 路线图

- **MVP（一期）**：最新公告及决议、常用入口导航、系统稳定性看板（静态）、组织速查
- **二期**：知识库 + 最佳实践沉淀、需求提交入口、Agent for Digital、项目进度跟踪

分期依据与理由见 [`outputs/03-product-solution.md`](outputs/03-product-solution.md)。

---

## 给接手的开发同事

先看 [`portal/README.md`](portal/README.md)（开发视角），里面记录了两个踩过的坑：

1. **flex 布局反直觉**：`flex-wrap: wrap` 的折行依据是 `flex-basis` 而非收缩后尺寸，所以"先折行、后收缩"会得到非单调布局。正解是 `flex: 0 1 <basis>; min-width: 0` 连续收缩。
2. **降级牺牲顺序**：logo 副标题 → 搜索文字 → agent 文字 → **最后才是导航文字**。导航是路标，不能先砍。

以及一条交付教训：`outputs/04-delivery-notes.md` 第 6 节记录了四种同形错误（"工具返回成功但没写盘"、"断言档位与缺陷错开"、"没人认领的格子一定是空的"、"测不到东西的断言跑完还是绿的"）。

---

## License

内部方案文档与原型，未开源授权。
