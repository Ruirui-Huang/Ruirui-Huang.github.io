# HuangR's Blog 源文件仓库

基于 **Hexo 7.3.0 + NexT 8.29.0（Gemini）** 的个人博客源文件（`source` 分支）。
部署产物在 `master` 分支（GitHub Pages，https://ruirui-huang.github.io/）。

## 常用命令

```bash
# 本地预览（http://localhost:4000）
npx hexo server -p 4000

# 生成静态站点
npx hexo clean && npx hexo g     # 改了 md/配置后建议 clean，增量可能不生效

# 部署线上（推 .deploy_git 到 master）
npx hexo d

# 备份源文件（每次改完都做）
git add -A && git commit -m "..." && git push origin HEAD:source
```

## 分支约定

| 分支 | 内容 | 更新方式 |
| --- | --- | --- |
| `master` | 编译产物（public/） | `npx hexo d`（自动推） |
| `source` | 源文件（本目录） | 手动 `git push origin HEAD:source` |

## 目录结构

```
D:\Code\blog
├── _config.yml          # 站点配置（含 markdown-it 渲染器）
├── _config.next.yml     # NexT 主题覆盖配置（打赏/评论/折叠等）
├── package.json         # 含 "hexo": {"version": "7.3.0"} 字段（缺失则插件不加载）
├── _backup_latex/       # LaTeX 转换版备份（md + 图片，已 gitignore，不部署）
├── source/
│   ├── _posts/          # 文章（7 篇；5 篇笔记为 PDF 嵌入显示）
│   ├── pdf/             # 5 篇学习笔记的 PDF（文章用 <embed> 嵌入）
│   ├── _data/styles.styl # 自定义样式
│   ├── tags/ categories/ # 标签云 / 分类页（type: tags/categories）
│   ├── about/            # 关于页
│   ├── robots.txt        # 爬虫规则（指向 sitemap.xml）
│   ├── 404.html          # 自定义 404
│   └── images/          # 站点图片（avatar/打赏二维码等）
└── themes/next/         # NexT 主题副本
```

## 关键配置备忘

- **渲染器**：`_config.yml` 用 `hexo-renderer-markdown-it`（含 KaTeX 插件配置，当前无文章使用公式，按页加载无副作用）。
- **评论**：Utterances（GitHub Issues，仓库已开 Issues）。Valine/LeanCloud 已废弃（2027-01-12 停服）。
- **打赏**：NexT `reward_settings` + `source/images/wechatpay.jpg` / `alipay.jpg`。
- **首页折叠**：文章 front-matter 写 `description`，主题开 `excerpt_description` + `read_more_btn`。
- **侧栏气泡词云**：`_config.next.yml` → `custom_file_path.sidebar: source/_data/sidebar.njk` + `sidebar.display: always`（首页也显示侧栏）。`sidebar.njk` 用 `tagcloud()` 输出标签 + 内嵌 JS（`styleBubbles`）把文字色转为气泡背景色（白字）。样式在 `_data/styles.styl` 的 `.sidebar-bubble-cloud`。注意：`{% for tag in site.tags %}` 在 inject 模板里取不到数据（已验证死路），必须用 `tagcloud()`；改 `styles.styl` 后需 `hexo clean && hexo g` 才会重编译进 `main.css`。
- **git 身份**（全局）：`Ruirui-Huang` / `Ruirui-Huang@users.noreply.github.com`（`.deploy_git` 子仓库读不到仓库级身份，必须全局）。

## 5 篇学习笔记的维护方式

杂记/多模态/语义分割/目标检测/OpenMMLab 这 5 篇以 **PDF 内嵌**展示（`<embed src="/pdf/xxx.pdf">`），
源文件在 Overleaf 维护。更新流程：

1. Overleaf 编辑后 **Download → PDF** 下载新 PDF；
2. 覆盖 `source/pdf/` 下对应文件（文件名与 md 中 embed 路径一致）；
3. `npx hexo d` 部署 + `git push origin HEAD:source` 备份。

曾经尝试过 LaTeX → Markdown 正文转换（pandoc + markdown-it + KaTeX），因排版不满意已回退；
转换版 md 与图片备份在 `_backup_latex/`，转换脚本与 runbook 见《搭建流程》第五章。

## 其他

- 换新电脑迁移流程见《搭建流程》第三章。
