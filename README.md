# 有些夜晚

一个移动端优先的安静告白单页网站，使用 React + Vite 实现。

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
```

## 文案

所有页面文案集中在：

```text
src/content/siteContent.js
```

后续只需要改这个文件里的字段即可，不用进组件里找文案。

## 背景音乐

把无版权风险、浏览器可播放的纯音乐文件放到：

```text
public/audio
```

当前项目会读取 `src/content/siteContent.js` 里的 `music.tracks.*.fileName`。文件名必须和 `public/audio` 里的真实文件名一致，路径不要写 Windows 绝对路径。

当前配置：

- `Ólafur Arnalds - This Place Is a Shelter.kgma`
- `Ólafur Arnalds - Near Light.kgg`

页面会在用户第一次轻触后尝试播放第一首，进入告白区后尝试切到第二首。没有文件或格式不支持时，音乐按钮仍然显示，页面不会报错。

## 部署

Vercel / Netlify：

- Build command: `npm run build`
- Publish directory: `dist`

GitHub Pages：

1. 仓库 Settings -> Pages -> Source 选择 GitHub Actions。
2. 项目已带 `.github/workflows/deploy-pages.yml`。
3. 推送到 `main` 分支后等待 Actions 完成。

## 写入 NFC

部署后复制最终 HTTPS URL，用手机 NFC 工具写入标签：

- iPhone：快捷指令 App -> 自动化/或第三方 NFC Tools -> 写入 URL。
- Android：NFC Tools -> Write -> Add a record -> URL/URI -> Write。

写入后，用手机靠近 NFC 标签测试是否能直接打开网页。
