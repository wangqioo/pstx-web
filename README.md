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

- **前端**: React + Vite（暗色工业风 UI）
- **后端**: FastAPI + Python（复用原有分析逻辑）

## 快速启动

### 1. 安装依赖

```bash
# 后端
cd backend
pip install -r requirements.txt

# 前端
cd frontend
NODE_ENV=development npm install --include=dev
```

### 2. 启动服务

```bash
# 后端（端口 8080）
cd backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8080

# 前端（端口 5173，新终端）
cd frontend
NODE_ENV=development node_modules/.bin/vite --host 0.0.0.0 --port 5173
```

或直接运行一键启动脚本：

```bash
bash start.sh
```

访问 http://localhost:5173

## 文件结构

```
pstx-web/
├── backend/
│   ├── analyzer.py      # 核心分析逻辑（从 pstx_analyzer.py 提取）
│   ├── main.py          # FastAPI 接口
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/  # BomView / NetworkView / DrcView / DeratingView / ResistorView / QueryPanel
│   │   └── styles/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── start.sh
```

## 使用方法

1. 打开浏览器访问 http://localhost:5173
2. 将 `pstxprt.dat` 和 `pstxnet.dat` 拖入上传区域
3. 设置项目名称和降额参数（可选）
4. 点击「⚡ 开始分析」
5. 切换各功能 Tab 查看分析结果
6. 点击「↓ 导出 Excel 报告」下载完整报告
