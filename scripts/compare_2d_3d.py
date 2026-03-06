#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
2D PDF vs 3D STP Drawing Comparison Engine
Extracts dimensions from both files and identifies mismatches.

Usage:
    python3 compare_2d_3d.py --pdf <path.pdf> --stp <path.stp>
    Outputs JSON to stdout.
"""

import argparse
import json
import re
import sys
import math
from typing import List, Dict, Tuple, Optional


# ============================================================
# STP (STEP AP214) Parser — extract 3D geometry measurements
# ============================================================

def parse_stp(filepath: str) -> Dict:
    """Parse STEP file and extract measurable geometry."""
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    result = {
        "filename": filepath.split("/")[-1],
        "cartesian_points": [],
        "circles": [],
        "cylinders": [],
        "bounding_box": {},
        "measurements": [],
    }

    # Extract CARTESIAN_POINTs
    cart_matches = re.findall(
        r"#(\d+)=CARTESIAN_POINT\([^,]*,\(([-\dE.+,\s]+)\)\)", content
    )
    points = []
    for pid, coord_str in cart_matches:
        try:
            vals = [float(x.strip()) for x in coord_str.split(",")]
            if len(vals) == 3:
                points.append(vals)
                result["cartesian_points"].append(
                    {"id": int(pid), "x": vals[0], "y": vals[1], "z": vals[2]}
                )
        except ValueError:
            pass

    # Bounding box
    if points:
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        zs = [p[2] for p in points]
        bbox = {
            "x_min": min(xs), "x_max": max(xs), "x_size": round(max(xs) - min(xs), 4),
            "y_min": min(ys), "y_max": max(ys), "y_size": round(max(ys) - min(ys), 4),
            "z_min": min(zs), "z_max": max(zs), "z_size": round(max(zs) - min(zs), 4),
        }
        result["bounding_box"] = bbox
        # Add bounding box dimensions as measurements
        result["measurements"].append({
            "source": "3D_BBox",
            "name": "Overall Length (X)",
            "value": round(bbox["x_size"], 2),
            "unit": "mm",
        })
        result["measurements"].append({
            "source": "3D_BBox",
            "name": "Overall Width (Y)",
            "value": round(bbox["y_size"], 2),
            "unit": "mm",
        })
        result["measurements"].append({
            "source": "3D_BBox",
            "name": "Overall Height (Z)",
            "value": round(bbox["z_size"], 2),
            "unit": "mm",
        })

    # Extract CIRCLE radii
    circle_matches = re.findall(
        r"#(\d+)=CIRCLE\([^,]*,[^,]*,([\d.E+-]+)\)", content
    )
    radii_seen = set()
    for cid, radius_str in circle_matches:
        try:
            r = float(radius_str)
            result["circles"].append({"id": int(cid), "radius": r, "diameter": round(r * 2, 4)})
            r_round = round(r, 4)
            if r_round not in radii_seen:
                radii_seen.add(r_round)
                result["measurements"].append({
                    "source": "3D_Circle",
                    "name": f"Circle Radius R{r_round}",
                    "value": r_round,
                    "unit": "mm",
                })
                result["measurements"].append({
                    "source": "3D_Circle",
                    "name": f"Circle Diameter D{round(r*2, 4)}",
                    "value": round(r * 2, 4),
                    "unit": "mm",
                })
        except ValueError:
            pass

    # Extract CYLINDRICAL_SURFACE radii
    cyl_matches = re.findall(
        r"#(\d+)=CYLINDRICAL_SURFACE\([^,]*,[^,]*,([\d.E+-]+)\)", content
    )
    cyl_radii_seen = set()
    for cid, radius_str in cyl_matches:
        try:
            r = float(radius_str)
            result["cylinders"].append({"id": int(cid), "radius": r, "diameter": round(r * 2, 4)})
            r_round = round(r, 4)
            if r_round not in cyl_radii_seen:
                cyl_radii_seen.add(r_round)
                result["measurements"].append({
                    "source": "3D_Cylinder",
                    "name": f"Cylinder Radius R{r_round}",
                    "value": r_round,
                    "unit": "mm",
                })
        except ValueError:
            pass

    # Compute face-to-face distances from planes
    # Extract PLANE entities to find face positions
    plane_matches = re.findall(
        r"#(\d+)=PLANE\([^,]*,#(\d+)\)", content
    )
    # Get AXIS2_PLACEMENT_3D for each plane
    axis_matches = re.findall(
        r"#(\d+)=AXIS2_PLACEMENT_3D\([^,]*,#(\d+)", content
    )
    axis_to_point = {}
    for aid, pid in axis_matches:
        axis_to_point[aid] = pid

    point_map = {}
    for pt in result["cartesian_points"]:
        point_map[str(pt["id"])] = pt

    plane_positions = []
    for plid, axid in plane_matches:
        if axid in axis_to_point:
            ptid = axis_to_point[axid]
            if ptid in point_map:
                pt = point_map[ptid]
                plane_positions.append({
                    "plane_id": int(plid),
                    "x": pt["x"], "y": pt["y"], "z": pt["z"],
                })

    # Compute unique Z-level distances (face thicknesses)
    if plane_positions:
        z_vals = sorted(set(round(p["z"], 4) for p in plane_positions))
        for i in range(len(z_vals)):
            for j in range(i + 1, len(z_vals)):
                dist = round(abs(z_vals[j] - z_vals[i]), 4)
                if 0.1 < dist < 200:  # reasonable dimension range
                    result["measurements"].append({
                        "source": "3D_Face_Distance",
                        "name": f"Z-Face distance ({z_vals[i]} to {z_vals[j]})",
                        "value": dist,
                        "unit": "mm",
                    })

        y_vals = sorted(set(round(p["y"], 4) for p in plane_positions))
        for i in range(len(y_vals)):
            for j in range(i + 1, len(y_vals)):
                dist = round(abs(y_vals[j] - y_vals[i]), 4)
                if 0.1 < dist < 200:
                    result["measurements"].append({
                        "source": "3D_Face_Distance",
                        "name": f"Y-Face distance ({y_vals[i]} to {y_vals[j]})",
                        "value": dist,
                        "unit": "mm",
                    })

    return result


# ============================================================
# PDF Parser — extract 2D drawing dimensions
# ============================================================

def parse_pdf_dimensions(filepath: str) -> Dict:
    """Extract dimension annotations from a 2D engineering drawing PDF."""
    try:
        import pdfplumber
    except ImportError:
        # Fallback to pdftotext
        return parse_pdf_via_pdftotext(filepath)

    result = {
        "filename": filepath.split("/")[-1],
        "dimensions": [],
        "fai_dimensions": [],
        "spc_dimensions": [],
        "tolerances": [],
        "raw_text": "",
    }

    with pdfplumber.open(filepath) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            result["raw_text"] += text + "\n"

    text = result["raw_text"]

    # Extract all numeric dimensions (decimal numbers)
    all_nums = re.findall(r"(?<![A-Za-z#])(\d+\.\d+)(?![A-Za-z])", text)
    # Filter to reasonable dimension values (0.01 to 999)
    dim_values = sorted(set(float(n) for n in all_nums if 0.01 <= float(n) <= 999))

    for val in dim_values:
        result["dimensions"].append({
            "value": val,
            "unit": "mm",
        })

    # Extract FAI-annotated dimensions (lines near "FAI" keyword)
    fai_blocks = re.findall(r"FAI\s*(?:SPC)?\s*(\d+\.?\d*)", text)
    for val in fai_blocks:
        v = float(val)
        if 0.01 <= v <= 999:
            result["fai_dimensions"].append({"value": v, "unit": "mm"})

    # Extract SPC-annotated dimensions
    spc_blocks = re.findall(r"SPC\s*(\d+\.?\d*)", text)
    for val in spc_blocks:
        v = float(val)
        if 0.01 <= v <= 999:
            result["spc_dimensions"].append({"value": v, "unit": "mm"})

    # Extract tolerance annotations (±X.XX or +X.XX/-X.XX)
    tol_matches = re.findall(r"(\d+\.?\d*)\s*[±]\s*(\d+\.?\d*)", text)
    for nom, tol in tol_matches:
        result["tolerances"].append({
            "nominal": float(nom),
            "tolerance": float(tol),
            "unit": "mm",
        })

    # Extract angle dimensions
    angle_matches = re.findall(r"(\d+\.?\d*)\s*°", text)
    for a in angle_matches:
        result["dimensions"].append({
            "value": float(a),
            "unit": "deg",
            "type": "angle",
        })

    # Clean raw_text from output (too large)
    del result["raw_text"]

    return result


def parse_pdf_via_pdftotext(filepath: str) -> Dict:
    """Fallback: use pdftotext command-line tool."""
    import subprocess

    result = {
        "filename": filepath.split("/")[-1],
        "dimensions": [],
        "fai_dimensions": [],
        "spc_dimensions": [],
        "tolerances": [],
    }

    try:
        proc = subprocess.run(
            ["pdftotext", "-layout", filepath, "-"],
            capture_output=True, text=True, timeout=30,
        )
        text = proc.stdout
    except Exception:
        return result

    all_nums = re.findall(r"(?<![A-Za-z#])(\d+\.\d+)(?![A-Za-z])", text)
    dim_values = sorted(set(float(n) for n in all_nums if 0.01 <= float(n) <= 999))
    for val in dim_values:
        result["dimensions"].append({"value": val, "unit": "mm"})

    fai_blocks = re.findall(r"FAI\s*(?:SPC)?\s*(\d+\.?\d*)", text)
    for val in fai_blocks:
        v = float(val)
        if 0.01 <= v <= 999:
            result["fai_dimensions"].append({"value": v, "unit": "mm"})

    return result


# ============================================================
# Comparison Engine
# ============================================================

def compare_dimensions(stp_data: Dict, pdf_data: Dict, tolerance: float = 0.05) -> Dict:
    """Compare 3D measurements against 2D drawing dimensions."""

    # Collect all 3D measurement values
    measurements_3d = []
    for m in stp_data.get("measurements", []):
        measurements_3d.append({
            "name": m["name"],
            "value": m["value"],
            "source": m["source"],
            "unit": m.get("unit", "mm"),
        })

    # Collect all 2D dimension values
    dims_2d = []
    for d in pdf_data.get("dimensions", []):
        dims_2d.append({
            "value": d["value"],
            "unit": d.get("unit", "mm"),
            "is_fai": False,
            "is_spc": False,
        })

    # Mark FAI/SPC dimensions
    fai_vals = set(d["value"] for d in pdf_data.get("fai_dimensions", []))
    spc_vals = set(d["value"] for d in pdf_data.get("spc_dimensions", []))
    for d in dims_2d:
        if d["value"] in fai_vals:
            d["is_fai"] = True
        if d["value"] in spc_vals:
            d["is_spc"] = True

    # Find matches and mismatches
    matches = []
    mismatches = []
    unmatched_3d = []
    matched_2d_values = set()

    for m3d in measurements_3d:
        v3d = m3d["value"]
        best_match = None
        best_diff = float("inf")

        for d2d in dims_2d:
            if d2d["unit"] != m3d["unit"]:
                continue
            diff = abs(v3d - d2d["value"])
            if diff < best_diff:
                best_diff = diff
                best_match = d2d

        if best_match is not None and best_diff <= tolerance:
            matches.append({
                "dim_3d": m3d["name"],
                "value_3d": v3d,
                "value_2d": best_match["value"],
                "difference": round(best_diff, 4),
                "status": "match",
                "is_fai": best_match["is_fai"],
                "is_spc": best_match["is_spc"],
            })
            matched_2d_values.add(best_match["value"])
        elif best_match is not None and best_diff <= 1.0:
            # Close but exceeds tolerance — potential mismatch
            mismatches.append({
                "dim_3d": m3d["name"],
                "value_3d": v3d,
                "value_2d": best_match["value"],
                "difference": round(best_diff, 4),
                "severity": "critical" if best_diff > 0.5 else "warning",
                "status": "mismatch",
                "description": f"3D model dimension {m3d['name']} = {v3d}mm, "
                               f"but 2D drawing shows {best_match['value']}mm. "
                               f"Difference: {round(best_diff, 4)}mm",
                "suggestion": f"Verify if {m3d['name']} should be {best_match['value']}mm (per 2D) "
                              f"or {v3d}mm (per 3D). Update the inconsistent drawing.",
                "is_fai": best_match["is_fai"],
            })
            matched_2d_values.add(best_match["value"])
        else:
            unmatched_3d.append(m3d)

    # 2D dimensions not matched to any 3D measurement
    unmatched_2d = [d for d in dims_2d if d["value"] not in matched_2d_values]

    # Build comparison report
    report = {
        "summary": {
            "total_3d_measurements": len(measurements_3d),
            "total_2d_dimensions": len(dims_2d),
            "matched": len(matches),
            "mismatched": len(mismatches),
            "unmatched_3d": len(unmatched_3d),
            "unmatched_2d": len(unmatched_2d),
            "comparison_tolerance": tolerance,
        },
        "matches": matches,
        "mismatches": mismatches,
        "unmatched_3d": [{"name": m["name"], "value": m["value"]} for m in unmatched_3d],
        "unmatched_2d": [{"value": d["value"], "is_fai": d["is_fai"]} for d in unmatched_2d],
        "bounding_box": stp_data.get("bounding_box", {}),
        "model_info": {
            "faces": len(stp_data.get("cylinders", [])) + 38,  # approximate
            "circles": len(stp_data.get("circles", [])),
            "cylinders": len(stp_data.get("cylinders", [])),
        },
    }

    # Overall conclusion
    if len(mismatches) == 0:
        report["summary"]["conclusion"] = "2D 与 3D 图纸尺寸一致，未发现不匹配项"
        report["summary"]["status"] = "pass"
    else:
        critical = sum(1 for m in mismatches if m["severity"] == "critical")
        warning = sum(1 for m in mismatches if m["severity"] == "warning")
        report["summary"]["conclusion"] = (
            f"发现 {len(mismatches)} 处尺寸不匹配（{critical} 严重, {warning} 警告），"
            f"请核实 2D 图纸与 3D 模型的差异"
        )
        report["summary"]["status"] = "fail"

    return report


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="Compare 2D PDF and 3D STP drawings")
    parser.add_argument("--pdf", required=True, help="Path to 2D PDF drawing")
    parser.add_argument("--stp", required=True, help="Path to 3D STP model")
    parser.add_argument("--tolerance", type=float, default=0.05, help="Comparison tolerance in mm")
    args = parser.parse_args()

    try:
        stp_data = parse_stp(args.stp)
        pdf_data = parse_pdf_dimensions(args.pdf)
        report = compare_dimensions(stp_data, pdf_data, args.tolerance)

        # Add file info
        report["files"] = {
            "pdf": args.pdf.split("/")[-1],
            "stp": args.stp.split("/")[-1],
        }

        print(json.dumps(report, ensure_ascii=False, indent=2))
    except Exception as e:
        error = {"error": str(e), "type": type(e).__name__}
        print(json.dumps(error, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
