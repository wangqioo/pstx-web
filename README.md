# PSTX 原理图分析工具 — Web 版

基于 [pstx_analyzer.py](https://github.com/wangqioo/bom-tools) 的 Web 化版本，将 Cadence Packager-XL 导出的原理图分析工具从桌面 GUI（tkinter）升级为现代 Web 应用。

## 功能

| 模块 | 说明 |
|------|------|
| BOM 管理 | 贴装 / DEPOP 明细与汇总，支持搜索排序 |
| 网络分析 | 电源网络、GND、差分对、单端网络、页面分布 |
| DRC 检查 | 缺料号 / 缺VALUE / TBD属性 / 单端网络 / 未命名网络 |
| 降额分析 | 电容工作电压自动推断，可调降额比例 |
| 电阻检查 | 串阻分压风险 / 重复上下拉 / OD缺上拉 / 芯片Pin总览 |
| 元件查询 | 按位号或网络名搜索，支持精确+模糊匹配 |
| Excel 导出 | 一键导出多 Sheet 完整分析报告 |

## 技术栈

- **前端**: React + Vite
- **后端**: FastAPI + Python（复用原有分析逻辑）

---

## 快速启动

### 环境要求

- Python 3.8+
- Node.js 18+

### 安装依赖

```bash
# 后端
cd backend
pip install -r requirements.txt

# 前端
cd frontend
npm install
```

### 启动服务

**方式一：分窗口启动（推荐）**

窗口 1 — 后端：
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8080
```

窗口 2 — 前端：
```bash
cd frontend
npm run dev
```

**方式二：Linux/Mac 一键启动**
```bash
bash start.sh
```

访问 **http://localhost:5173**

---

## 使用方法

1. 打开浏览器访问 http://localhost:5173
2. 将 `pstxprt.dat` 和 `pstxnet.dat` 拖入上传区域（支持拖拽或点击选择）
3. 填写项目名称，设置降额比例（可选）
4. 点击「⚡ 开始分析」
5. 切换各功能 Tab 查看分析结果
6. 点击「↓ 导出 Excel 报告」下载完整报告

---

## 文件结构

```
pstx-web/
├── backend/
│   ├── analyzer.py      # 核心分析逻辑（从 pstx_analyzer.py 提取）
│   ├── main.py          # FastAPI REST 接口
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── UploadPanel.jsx
│   │   │   ├── StatsBar.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── BomView.jsx
│   │   │   ├── NetworkView.jsx
│   │   │   ├── DrcView.jsx
│   │   │   ├── DeratingView.jsx
│   │   │   ├── ResistorView.jsx
│   │   │   └── QueryPanel.jsx
│   │   └── styles/
│   │       └── globals.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── start.sh
```
