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
├── _config.yml          # 站点配置（含 markdown-it+KaTeX 渲染器）
├── _config.next.yml     # NexT 主题覆盖配置（打赏/评论/KaTeX/折叠等）
├── package.json         # 含 "hexo": {"version": "7.3.0"} 字段（缺失则插件不加载）
├── source/
│   ├── _posts/          # 文章（10 篇；5 篇为 LaTeX 转换，front-matter 含 mathjax: true）
│   ├── _data/styles.styl # 自定义样式（figure/图注排版）
│   └── images/          # 文章图片（zaji/multimodal/semantic_seg/target_detection/openmmlab）
└── themes/next/         # NexT 主题副本
```

## 关键配置备忘

- **数学公式**：`_config.yml` 用 `hexo-renderer-markdown-it` + `@renbaoshuo/markdown-it-katex`（服务端渲染）；`_config.next.yml` 开 KaTeX 且 `every_page: false`，文章 front-matter 加 `mathjax: true` 按页加载。
- **评论**：Utterances（GitHub Issues，仓库已开 Issues）。Valine/LeanCloud 已废弃（2027-01-12 停服）。
- **打赏**：NexT `reward_settings` + `source/images/wechatpay.jpg` / `alipay.jpg`。
- **首页折叠**：文章 front-matter 写 `description`，主题开 `excerpt_description` + `read_more_btn`。
- **git 身份**（全局）：`Ruirui-Huang` / `Ruirui-Huang@users.noreply.github.com`（`.deploy_git` 子仓库读不到仓库级身份，必须全局）。

## LaTeX 笔记 → 博客正文

5 篇笔记（杂记/多模态/语义分割/目标检测/OpenMMLab）由 Overleaf LaTeX 源经 pandoc 转换。
转换脚本 `convert_tex.py` 与检查脚本 `scan_pages.py` 在工具目录
`C:\Users\10327\Doubao\chats\2026-09-10\new-chat-1\`，Overleaf 原始 zip 在 `D:\Docs\`，
解压源在 `...\new-chat-1\overleaf_src\<项目名>\`。完整流程见文章《搭建流程》第五章。

## 其他

- 旧 PDF（`source/pdf/*.pdf`）保留作下载备份，文章已不再嵌入。
- 换新电脑迁移流程见《搭建流程》第三章。
