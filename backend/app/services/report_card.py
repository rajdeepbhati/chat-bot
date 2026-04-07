from __future__ import annotations

from io import BytesIO

import httpx
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.core.config import get_settings


def build_fallback_summary(student: dict, marks: list[dict]) -> str:
    attendance = float(student.get("attendance_percentage") or 0)
    average = (
        sum((mark["score"] / mark["max_score"]) * 100 for mark in marks) / len(marks)
        if marks
        else 0.0
    )

    if attendance >= 85 and average >= 75:
        return (
            f"{student['name']} is performing well overall with strong attendance and stable academic results. "
            "The student should continue consistent revision and class participation to maintain this progress."
        )
    if attendance < 75 and average < 60:
        return (
            f"{student['name']} needs urgent academic support. Attendance is below the expected threshold and marks "
            "show clear learning gaps, so a guided improvement plan, extra practice, and closer mentoring are recommended."
        )
    if attendance < 75:
        return (
            f"{student['name']} shows acceptable academic ability, but attendance is too low and may affect long-term performance. "
            "Improving regular class participation should be the immediate priority."
        )
    return (
        f"{student['name']} attends classes regularly but needs improvement in assessment performance. "
        "Focused revision, topic-wise practice, and timely doubt clearing are recommended."
    )


async def generate_performance_summary(student: dict, marks: list[dict]) -> str:
    settings = get_settings()
    if not settings.openai_api_key:
        return build_fallback_summary(student, marks)

    marks_lines = "\n".join(
        f"- {mark['subject']} {mark['exam_type']}: {mark['score']}/{mark['max_score']}"
        for mark in marks
    ) or "- No marks available"

    prompt = (
        "Write a professional but supportive student performance summary for a report card in 3 to 4 sentences. "
        "Mention strengths, improvement areas, and one practical recommendation.\n\n"
        f"Student: {student['name']}\n"
        f"Enrollment No: {student['enrollment_no']}\n"
        f"Semester: {student['semester']}\n"
        f"Attendance Percentage: {student['attendance_percentage']}\n"
        f"Latest Mark: {student['latest_mark']}\n"
        f"Marks:\n{marks_lines}\n"
    )

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.openai_model,
                "input": prompt,
            },
        )

    if response.status_code >= 400:
        return build_fallback_summary(student, marks)

    payload = response.json()
    output_text = payload.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()

    for output in payload.get("output", []):
        for content in output.get("content", []):
            text = content.get("text")
            if isinstance(text, str) and text.strip():
                return text.strip()

    return build_fallback_summary(student, marks)


def _grade_for_percentage(value: float) -> str:
    if value >= 90:
        return "A+"
    if value >= 80:
        return "A"
    if value >= 70:
        return "B"
    if value >= 60:
        return "C"
    if value >= 50:
        return "D"
    return "F"


def generate_report_card_pdf(student: dict, marks: list[dict], performance_summary: str) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=8,
    )
    section_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Heading2"],
        fontSize=12,
        leading=14,
        textColor=colors.HexColor("#0f766e"),
        spaceAfter=6,
    )

    avg_percentage = (
        sum((mark["score"] / mark["max_score"]) * 100 for mark in marks) / len(marks)
        if marks
        else 0.0
    )

    story = [
        Paragraph("EduFlow Campus Portal", styles["Title"]),
        Paragraph("Student Report Card", title_style),
        Spacer(1, 6),
    ]

    student_info = Table(
        [
            ["Student Name", student["name"], "Enrollment No", student["enrollment_no"]],
            ["Semester", str(student["semester"]), "Attendance", f"{student['attendance_percentage']}%"],
            ["Latest Mark", str(student.get("latest_mark") or "--"), "Overall Grade", _grade_for_percentage(avg_percentage)],
        ],
        colWidths=[34 * mm, 56 * mm, 34 * mm, 46 * mm],
    )
    student_info.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.whitesmoke),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.extend([student_info, Spacer(1, 12)])

    story.append(Paragraph("Marks Summary", section_style))
    marks_rows = [["Subject", "Exam Type", "Score", "Max Score", "Percentage", "Grade"]]
    for mark in marks:
        percentage = (mark["score"] / mark["max_score"]) * 100 if mark["max_score"] else 0
        marks_rows.append(
            [
                mark["subject"],
                mark["exam_type"],
                str(mark["score"]),
                str(mark["max_score"]),
                f"{percentage:.1f}%",
                _grade_for_percentage(percentage),
            ]
        )

    if len(marks_rows) == 1:
        marks_rows.append(["No marks available", "-", "-", "-", "-", "-"])

    marks_table = Table(marks_rows, colWidths=[44 * mm, 30 * mm, 22 * mm, 24 * mm, 26 * mm, 20 * mm])
    marks_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f766e")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.extend([marks_table, Spacer(1, 12)])

    story.append(Paragraph("Attendance Summary", section_style))
    attendance_table = Table(
        [["Attendance Percentage", f"{student['attendance_percentage']}%"]],
        colWidths=[70 * mm, 40 * mm],
    )
    attendance_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ecfeff")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.lightgrey),
                ("FONTNAME", (0, 0), (0, 0), "Helvetica-Bold"),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.extend([attendance_table, Spacer(1, 12)])

    story.append(Paragraph("AI Performance Summary", section_style))
    story.append(Paragraph(performance_summary, styles["BodyText"]))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
