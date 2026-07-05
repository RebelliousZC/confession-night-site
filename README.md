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

- `Ólafur Arnalds - Living Room Songs P7 This place is a shelter.aac`
- `Ólafur Arnalds - Living Room Songs P2 Near Light.acc`

页面会在用户第一次轻触后尝试播放第一首，进入告白区后尝试切到第二首。没有文件或格式不支持时，音乐按钮仍然显示，页面不会报错。

## 部署

### GitHub Pages

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_BASE=/confession-night-site/`

项目已带 `.github/workflows/deploy-pages.yml`，推送到 `main` 后可通过 GitHub Actions 部署。

### Tencent Cloud EdgeOne Pages

- Framework: `Vite / React`
- Install command: `npm install` 或 `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Node.js version: `20`，`18` 也可以
- Environment variable: `VITE_BASE=/`

`vite.config.js` 会读取 `VITE_BASE`。GitHub Pages 使用仓库子路径 `/confession-night-site/`，EdgeOne Pages 独立域名或系统分配域名通常使用 `/`。

腾讯云控制台手动步骤：

1. 登录腾讯云控制台。
2. 进入 EdgeOne Pages / EdgeOne Makers。
3. 连接 GitHub。
4. 选择仓库 `RebelliousZC/confession-night-site`。
5. 选择 `main` 分支。
6. 填写构建配置：Install command `npm install`，Build command `npm run build`，Output directory `dist`，Environment variable `VITE_BASE=/`。
7. 点击部署。
8. 部署成功后复制腾讯云分配的访问链接。
9. 用手机流量和校园网分别测试。
10. 把最终稳定链接写入 NFC 芯片。

### Vercel / Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_BASE=/`

### COS 静态网站备用方案

1. 在腾讯云 COS 创建 bucket。
2. 如需临时公开访问，将 bucket 或对象读权限设为公开读；更稳妥的公开访问可配合 CDN/自定义域名。
3. 开启静态网站功能，Index document 填 `index.html`，Error document 可填 `index.html` 或 `404.html`。
4. 本地执行 `npm run build`。
5. 上传 `dist` 目录中的全部文件到 bucket 根目录。
6. 如果使用自定义域名，国内域名通常可能涉及备案；不使用自定义域名时，可先用 COS 提供的访问地址临时展示。

## 写入 NFC

部署后复制最终 HTTPS URL，用手机 NFC 工具写入标签：

- iPhone：快捷指令 App -> 自动化/或第三方 NFC Tools -> 写入 URL。
- Android：NFC Tools -> Write -> Add a record -> URL/URI -> Write。

写入后，用手机靠近 NFC 标签测试是否能直接打开网页。
