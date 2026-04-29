# -*- coding: utf-8 -*-
"""PSTX Web 分析工具 — FastAPI 后端"""

import io
import json
import os
import tempfile
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

from analyzer import (
    analyze_derating,
    analyze_networks,
    analyze_resistors,
    build_bom,
    check_drc,
    export_to_excel,
    parse_all,
    resolve_component_pages,
)

app = FastAPI(title="PSTX 分析工具 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _read_content(upload: UploadFile) -> str:
    raw = upload.file.read()
    for enc in ["utf-8-sig", "utf-16", "utf-16-le", "utf-16-be", "utf-8", "gb18030", "cp936"]:
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


@app.post("/api/analyze")
async def analyze(
    prt_file: UploadFile = File(...),
    net_file: UploadFile = File(...),
    project_name: str = Form(default=""),
    derating_pct: float = Form(default=70.0),
    include_depop: bool = Form(default=False),
    custom_volt_map: str = Form(default=""),
):
    """接收 pstxprt.dat 和 pstxnet.dat，返回完整分析结果 JSON"""
    prt_content = _read_content(prt_file)
    net_content = _read_content(net_file)

    components, nets, _ = parse_all(prt_content, net_content)
    resolve_component_pages(components, "")

    # 解析自定义电压映射
    volt_map = None
    if custom_volt_map.strip():
        volt_map = {}
        for line in custom_volt_map.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, _, v = line.partition("=")
                try:
                    volt_map[k.strip()] = float(v.strip())
                except ValueError:
                    pass

    bom_normal_detail, bom_depop_detail, bom_normal_merged, bom_depop_merged = build_bom(components)
    net_analysis = analyze_networks(nets, components)
    drc = check_drc(components, nets)
    derating = analyze_derating(components, nets, derating_pct, volt_map, include_depop)
    resistors = analyze_resistors(components, nets)

    # net_analysis 里有 Counter 和 dict，需要序列化处理
    na_serializable = {
        "total": net_analysis["total"],
        "single_node": {k: v for k, v in net_analysis["single_node"].items()},
        "gnd_nets": {k: len(v) for k, v in net_analysis["gnd_nets"].items()},
        "power_nets": {k: len(v) for k, v in net_analysis["power_nets"].items()},
        "diff_pairs": {k: v for k, v in net_analysis["diff_pairs"].items()},
        "page_counter": dict(net_analysis["page_counter"]),
    }

    # resistors 里的 defaultdict 需要序列化
    res_serializable = {
        "dup_pullups": resistors["dup_pullups"],
        "dup_pulldowns": resistors["dup_pulldowns"],
        "divider_risks": resistors["divider_risks"],
        "od_missing": resistors["od_missing"],
        "chip_pin_rows": resistors["chip_pin_rows"],
    }

    return {
        "project_name": project_name,
        "stats": {
            "total_components": len(components),
            "total_nets": len(nets),
            "bom_normal_count": sum(r.get("数量", 0) for r in bom_normal_merged),
            "bom_depop_count": sum(r.get("数量", 0) for r in bom_depop_merged),
            "bom_normal_types": len(bom_normal_merged),
            "drc_issues": sum(len(v) for v in drc.values() if isinstance(v, list)),
            "derating_fail": sum(1 for r in derating if r.get("状态", "").startswith("❌")),
            "derating_total": len(derating),
            "single_node_nets": len(net_analysis["single_node"]),
            "diff_pairs": len(net_analysis["diff_pairs"]),
        },
        "bom_normal_detail": bom_normal_detail,
        "bom_depop_detail": bom_depop_detail,
        "bom_normal_merged": bom_normal_merged,
        "bom_depop_merged": bom_depop_merged,
        "net_analysis": na_serializable,
        "drc": drc,
        "derating": derating,
        "resistors": res_serializable,
    }


@app.post("/api/export")
async def export_excel(payload: dict):
    """接收分析结果 JSON，生成 Excel 并返回文件流"""
    project_name = payload.get("project_name", "未命名项目")

    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        export_to_excel(
            {
                "project_name": project_name,
                "bom_normal_detail": payload.get("bom_normal_detail", []),
                "bom_depop_detail": payload.get("bom_depop_detail", []),
                "bom_normal_merged": payload.get("bom_normal_merged", []),
                "bom_depop_merged": payload.get("bom_depop_merged", []),
                "net_analysis": {
                    "total": payload.get("net_analysis", {}).get("total", 0),
                    "single_node": payload.get("net_analysis", {}).get("single_node", {}),
                    "gnd_nets": {k: [{}] * v for k, v in payload.get("net_analysis", {}).get("gnd_nets", {}).items()},
                    "power_nets": {k: [{}] * v for k, v in payload.get("net_analysis", {}).get("power_nets", {}).items()},
                    "diff_pairs": payload.get("net_analysis", {}).get("diff_pairs", {}),
                    "page_counter": payload.get("net_analysis", {}).get("page_counter", {}),
                },
                "drc": payload.get("drc", {}),
                "derating": payload.get("derating", []),
                "resistor_analysis": payload.get("resistors", {}),
            },
            tmp_path,
        )
        with open(tmp_path, "rb") as f:
            content = f.read()
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    filename = f"{project_name or 'pstx_report'}.xlsx"
    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/api/query")
async def query(payload: dict):
    """在已解析的组件/网络数据中查询"""
    components = payload.get("components", {})
    nets = payload.get("nets", {})
    keyword = payload.get("keyword", "").strip()
    mode = payload.get("mode", "位号")  # 位号 | 网络

    if not keyword:
        return {"results": [], "mode": mode}

    results = []
    if mode == "位号":
        comp = components.get(keyword) or next(
            (v for k, v in components.items() if k.upper() == keyword.upper()), None
        )
        if comp:
            results = [comp]
        else:
            matched_keys = sorted(k for k in components if keyword.upper() in k.upper())
            results = [{"_fuzzy_match": k, **components[k]} for k in matched_keys[:50]]
    else:
        nodes = nets.get(keyword) or nets.get(
            next((k for k in nets if k.upper() == keyword.upper()), ""), []
        )
        if nodes:
            results = nodes
        else:
            matched_keys = sorted(k for k in nets if keyword.upper() in k.upper())
            results = [{"_net_name": k, "_node_count": len(nets[k])} for k in matched_keys[:50]]

    return {"results": results, "mode": mode, "keyword": keyword}


# 静态文件（前端构建产物）
_static_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(_static_dir):
    app.mount("/", StaticFiles(directory=_static_dir, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
