# ZH-CN → ZH-TW (Taiwan) glossary

Reference for converting Simplified Chinese technical documents and skill
folders to Taiwan Traditional Chinese. OpenCC `s2twp` handles glyph conversion
and many common terms; this glossary governs the judgment calls it cannot make.

## General conversion rules

### Confidence tiers

- **HIGH**: use the Taiwan term only.
- **MEDIUM**: use the Taiwan term, and put the English term in parentheses at the
  first occurrence in each file. Example: `檢視區（viewport）`,
  `設定檔（config file）`, `版本庫（repository）`.
- **LOW**: keep the English term and add no forced Chinese. Example: `hook`,
  `chunk`, `widget`, `mockup`. A guessed translation is worse than the English.

### Always

- Convert Simplified glyphs to Taiwan Traditional glyphs.
- Prefer Taiwan wording over mainland wording wherever a term exists.
- Localize the register, not just the words. A terse doc stays terse.
- Keep code, identifiers, paths, flags, and machine-readable keys byte-identical.
- When two Taiwan forms are defensible, leave the term for manual review instead
  of picking one silently.
- Treat OpenCC output as a draft. Read the diff before writing.

### Do not translate or alter

Product names and company names. Library and framework names (React, Vite,
Node.js, npm, npx, OpenCC, Git). Code identifiers, file paths, CLI flags, JSON
and YAML keys, CSS property names, environment variable names, URLs, license
headers, and version strings. These are identifiers, not prose.

### Worked example

`默认在页面加载后读取配置，用户点击保存。`
→ `預設在頁面載入後讀取設定，使用者點擊儲存。`

The glyphs change, `默认 → 預設` and `用户 → 使用者` are terminology, `配置`
became `設定` because the sentence means a settings object. A configuration
format would read better as `組態`.

## Term glossary

### 1. General software terms

| zh-CN | zh-TW (Taiwan) | Notes |
|---|---|---|
| 软件 | 軟體 | HIGH |
| 硬件 | 硬體 | HIGH |
| 界面 | 介面 | HIGH |
| 用户 | 使用者 | HIGH |
| 默认 | 預設 | HIGH |
| 默认值 | 預設值 | HIGH |
| 交互 | 互動 | HIGH |
| 设置 | 設定 | HIGH |
| 支持 | 支援 | HIGH for compatibility; 支持 for "endorse" |
| 创建 | 建立 | HIGH |
| 实现 | 實作 | HIGH for code; 實現 for "realize a goal" |
| 运行 | 執行 | HIGH |
| 执行 | 執行 | same word |
| 优化 | 最佳化 | HIGH |
| 质量 | 品質 | HIGH; 質量 means mass in Taiwan |
| 数据 | 資料 | HIGH; 數據 is understood but reads CN |
| 代码 | 程式碼 | HIGH |
| 项目 | 專案 | HIGH |
| 组件 | 元件 | HIGH |
| 类型 | 型別 | HIGH in code context |
| 对象 | 物件 | HIGH |
| 数组 | 陣列 | HIGH |
| 变量 | 變數 | HIGH |
| 参数 | 參數 | same word |
| 属性 | 屬性 | same word |
| 状态 | 狀態 | same word |
| 插件 | 外掛 | HIGH |
| 库 | 函式庫 | HIGH for a code library |
| 依赖 | 相依 | MEDIUM; 依賴 is understood but reads CN |
| 缓存 | 快取 | HIGH |
| 内存 | 記憶體 | HIGH |
| 存储 | 儲存 | HIGH |
| 密钥 | 金鑰 | HIGH |
| 超时 | 逾時 | HIGH |
| 并发 | 並行 | HIGH |
| 字段 | 欄位 | HIGH |
| 标识 | 識別碼 | MEDIUM; 標識 for a physical label |
| 环境变量 | 環境變數 | HIGH |
| 后端 | 後端 | same word |
| 服务端 | 伺服器端 | HIGH |
| 接口 | 介面 / API | LOW if it means a web API: keep `API` |
| 命令行 | 命令列 | HIGH |
| 终端 | 終端機 | HIGH |
| 脚本 | 指令碼 / 腳本 | MEDIUM, see ambiguous terms |
| 源码 | 原始碼 | HIGH |
| 样式 | 樣式 | same word |
| 图标 | 圖示 | HIGH |
| 控件 | 控制項 | HIGH |
| 链接 | 連結 | HIGH |
| 构建 | 建置 | HIGH for build systems |
| 部署 | 部署 | same word |
| 仓库 | 版本庫 | MEDIUM; 倉庫 means a warehouse |
| 帧 | 影格 | HIGH for animation and video |

### 2. Files and system terms

| zh-CN | zh-TW (Taiwan) | Notes |
|---|---|---|
| 文件 (file) | 檔案 | HIGH only when the sense is a file |
| 文件夹 | 資料夾 | HIGH |
| 目录 | 目錄 | same word |
| 路径 | 路徑 | same word |
| 文件大小 | 檔案大小 | HIGH |
| 后缀 | 副檔名 | HIGH for file extensions |
| 离线 | 離線 | HIGH |
| 联网 | 連線 | MEDIUM; 上網 for a person going online |
| 快照 | 快照 | same word |
| 导出 | 匯出 | HIGH |
| 导入 | 匯入 | HIGH |
| 复制 | 複製 | HIGH |
| 粘贴 | 貼上 | HIGH |
| 剪贴板 | 剪貼簿 | HIGH |
| 登录 | 登入 | HIGH |
| 保存 | 儲存 | HIGH |
| 打开 | 開啟 | HIGH |
| 加载 | 載入 | HIGH |
| 刷新 | 重新整理 | HIGH for a UI refresh |
| 服务器 | 伺服器 | HIGH |
| 浏览器 | 瀏覽器 | same word |

### 3. Tech-doc terms

| zh-CN | zh-TW (Taiwan) | Notes |
|---|---|---|
| 文档 | 文件 | HIGH for documentation; 檔案 would mean a file |
| 程序代码 | 程式碼 | HIGH |
| 质量 | 品質 | HIGH |
| 信息 | 資訊 | HIGH |
| 网络 | 網路 | HIGH |
| 调试 | 除錯 | HIGH |
| 数据库 | 資料庫 | HIGH |
| 示例 | 範例 | HIGH |
| 说明 | 說明 | same word |
| 输入 | 輸入 | same word |
| 输出 | 輸出 | same word |
| 配置文件 | 設定檔 | HIGH for a file; 組態檔 also valid |
| 环境 | 環境 | same word |
| 测试 | 測試 | same word |
| 断言 | 斷言 | same word |
| 校验 | 驗證 | MEDIUM; 校驗 for a checksum |

### 4. Web and frontend terms

| zh-CN | zh-TW (Taiwan) | Notes |
|---|---|---|
| 页面 | 頁面 | same word |
| 首页 | 首頁 | same word |
| 菜单 | 選單 | HIGH |
| 标签页 | 分頁 | HIGH |
| 对话框 | 對話框 | same word |
| 侧栏 | 側邊欄 | HIGH |
| 表单 | 表單 | same word |
| 按钮 | 按鈕 | same word |
| 响应式 | 響應式 | MEDIUM; 自適應 also used |
| 视口 | 檢視區 | MEDIUM; 視埠 for hardware |
| 窗口 | 視窗 | HIGH |
| 滚动 | 捲動 | HIGH |
| 滚动条 | 捲軸 | HIGH |
| 拖拽 | 拖曳 | HIGH |
| 点击 | 點擊 | same word |
| 悬停 | 滑入 | MEDIUM; 懸停 understood |
| 缩放 | 縮放 | same word |
| 鼠标 | 滑鼠 | HIGH |
| 键盘 | 鍵盤 | same word |
| 移动端 | 行動裝置 | MEDIUM |
| 设备 | 裝置 | HIGH |
| 像素 | 像素 | same word in CSS; 畫素 in print |
| 网页 | 網頁 | same word |
| 网站 | 網站 | same word |
| 官网 | 官網 | same word |
| 落地页 | 到達頁 | MEDIUM; 著陸頁 also used |
| 渲染 | 算圖 / 彩現 | MEDIUM; 渲染 is widely read but CN-leaning |
| 字体 | 字型 | HIGH in web/CSS context |
| 布局 | 版面配置 | MEDIUM; 佈局 also seen |
| 缩略图 | 縮圖 | HIGH |
| 骨架 | 骨架 | same word |

## Ambiguous terms

These have real Taiwan-versus-mainland divergence or more than one defensible
Taiwan form. Stop and read the sentence. Do not blanket-replace them, and do not
add them to `overrides.json`.

1. **配置** — a settings object is 設定; a system or build configuration is 組態.
   A config file is 設定檔 or 組態檔 depending on the register.
2. **脚本** — Microsoft style is 指令碼; Taiwan web development commonly writes
   腳本. Match the file's existing register.
3. **仓库** — a `git` repository is 版本庫; a package store may be 儲存庫; a
   physical warehouse is 倉庫. Never blanket-replace 倉庫.
4. **依赖** — the Taiwan term for a software dependency is 相依, but 依賴 is
   common in older docs and sometimes means emotional or logical reliance.
5. **校验** — general validation is 驗證; a checksum or parity check can stay
   校驗. A function named `validate` keeps its name in code.
6. **接口** — a UI interface is 介面; a web API stays `API` in English. The same
   source word covers both.
7. **生成** — Taiwan AI and tooling prose uses 生成; classic writing prefers
   產生. Pick per paragraph, not per file.
8. **文件** — a document is 文件; a file on disk is 檔案. OpenCC maps 文件 to
   檔案, so verify every hit.
9. **质量** — 品質 for quality; 質量 for physical mass. Only the first is the
   software sense.
10. **提交** — a commit is 提交; submitting a form is 送出.
11. **归档** — 封存 and 歸檔 are both current in Taiwan. Match the surrounding
    vocabulary.
12. **像素 / 畫素** — CSS uses 像素; print and prepress use 畫素. Keep 像素 for
    screen coordinates.

## Notes

- Rows marked "same word" need glyph conversion only; do not invent a synonym.
- A term that appears in a code span, link target, or frontmatter key is data, not
  prose. Leave it alone even when the table lists a Taiwan form.
- `overrides.json` contains only phrase-level fixes where OpenCC reliably
  produces the wrong Taiwan result. It is deliberately short; add an entry only
  when the replacement is safe regardless of context.
- Conversion is one-way. The result is not guaranteed to round-trip back to the
  source through `tw2sp`, and no workflow here claims that it does.
