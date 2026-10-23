import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.units import inch

def generate_resume_pdf(resume_data):
    """
    Generate a clean, high-quality professional PDF resume matching
    Growvia AI's typography and color scheme using ReportLab.
    Returns a BytesIO buffer.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    story = []
    styles = getSampleStyleSheet()

    # Brand Colors
    PRIMARY_COLOR = colors.HexColor("#D96B43") # Warm rust/orange
    DARK_COLOR = colors.HexColor("#292318")    # Deep ink
    MUTED_COLOR = colors.HexColor("#6A5B53")   # Muted ink
    BORDER_COLOR = colors.HexColor("#F0DFC0")  # Soft cream border

    # Styles
    name_style = ParagraphStyle(
        "ResumeName",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=PRIMARY_COLOR,
        alignment=1 # Center
    )

    contact_style = ParagraphStyle(
        "ResumeContact",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        textColor=MUTED_COLOR,
        alignment=1 # Center
    )

    section_header_style = ParagraphStyle(
        "ResumeSectionHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=PRIMARY_COLOR,
        spaceBefore=8,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        "ResumeBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=DARK_COLOR
    )

    bold_body_style = ParagraphStyle(
        "ResumeBoldBody",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=14,
        textColor=DARK_COLOR
    )

    # 1. Header (Name, Contacts, Links)
    full_name = (resume_data.get("rName") or "Student Name").strip().upper()
    story.append(Paragraph(full_name, name_style))
    story.append(Spacer(1, 4))

    contacts = [
        resume_data.get("rEmail", "").strip(),
        resume_data.get("rPhone", "").strip(),
        resume_data.get("rLocation", "").strip()
    ]
    contact_str = " · ".join([c for c in contacts if c])
    if contact_str:
        story.append(Paragraph(contact_str, contact_style))

    links = [
        resume_data.get("rLinkedin", "").strip(),
        resume_data.get("rGithub", "").strip()
    ]
    link_str = " | ".join([l for l in links if l])
    if link_str:
        story.append(Paragraph(link_str, contact_style))

    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_COLOR, spaceAfter=8))

    def add_section(title, content_list):
        if not content_list:
            return
        # Check if all contents are empty
        has_content = any(bool(item and str(item).strip()) for item in content_list)
        if not has_content:
            return

        story.append(Paragraph(title, section_header_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceAfter=5))
        for item in content_list:
            if isinstance(item, tuple):
                # Bold label + regular text
                label, val = item
                if val and str(val).strip():
                    p_text = f"<b>{label}:</b> {val}"
                    story.append(Paragraph(p_text.replace("\n", "<br/>"), body_style))
            else:
                if item and str(item).strip():
                    story.append(Paragraph(str(item).replace("\n", "<br/>"), body_style))
        story.append(Spacer(1, 6))

    # 2. Professional Summary
    summary = resume_data.get("rSummary", "").strip()
    if summary:
        add_section("PROFESSIONAL SUMMARY", [summary])

    # 3. Education
    edu_parts = []
    degree = resume_data.get("rDegree", "").strip()
    college = resume_data.get("rCollege", "").strip()
    grad = resume_data.get("rGraduation", "").strip()
    cgpa = resume_data.get("rCgpa", "").strip()

    if degree or college:
        line1 = f"<b>{degree}</b>" if degree else ""
        if college:
            line1 += f" - {college}" if line1 else f"<b>{college}</b>"
        edu_parts.append(line1)

    details = []
    if grad:
        details.append(f"Graduation: {grad}")
    if cgpa:
        details.append(f"CGPA/Percentage: {cgpa}")
    if details:
        edu_parts.append(" | ".join(details))

    if edu_parts:
        add_section("EDUCATION", edu_parts)

    # 4. Technical Skills
    skills = resume_data.get("rSkills", "").strip()
    if skills:
        add_section("TECHNICAL SKILLS", [skills])

    # 5. Projects
    projects = resume_data.get("rProjects", "").strip()
    if projects:
        add_section("PROJECTS", [projects])

    # 6. Internships / Experience
    exp = resume_data.get("rExperience", "").strip()
    if exp:
        add_section("INTERNSHIPS & WORK EXPERIENCE", [exp])

    # 7. Certifications
    certs = resume_data.get("rCertifications", "").strip()
    if certs:
        add_section("CERTIFICATIONS", [certs])

    # 8. Achievements
    achieve = resume_data.get("rAchievements", "").strip()
    if achieve:
        add_section("ACHIEVEMENTS & EXTRACURRICULAR", [achieve])

    # Build document
    doc.build(story)
    buffer.seek(0)
    return buffer
