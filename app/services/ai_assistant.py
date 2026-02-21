"""
Rule-based Virtual Health Assistant
Matches patient questions to clinical topic areas and returns
structured guidance — no external API required for this prototype.
"""
from typing import Dict


# ---------------------------------------------------------------------------
# Knowledge base: keyword triggers → response
# ---------------------------------------------------------------------------
KNOWLEDGE_BASE: list[Dict] = [
    {
        "keywords": ["glucose", "sugar", "blood sugar", "hyperglycemia", "hypoglycemia", "diabetic", "diabetes"],
        "topic": "Blood Glucose",
        "response": (
            "**Blood Glucose Management**\n\n"
            "• Normal fasting range: 70–99 mg/dL\n"
            "• Pre-diabetic fasting range: 100–125 mg/dL\n"
            "• Diabetic concern: fasting ≥126 mg/dL\n\n"
            "**Tips:**\n"
            "- Take readings at consistent times (fasting, 2hrs post-meal)\n"
            "- Avoid high-glycaemic foods (white bread, sugary drinks)\n"
            "- Stay active: even 20-min walks lower glucose\n"
            "- Never skip prescribed insulin or oral medications\n"
            "- Contact your doctor if readings consistently exceed 200 mg/dL"
        ),
    },
    {
        "keywords": ["blood pressure", "bp", "hypertension", "systolic", "diastolic", "pressure"],
        "topic": "Blood Pressure",
        "response": (
            "**Blood Pressure Management**\n\n"
            "• Normal: <120/80 mmHg\n"
            "• Elevated: 120–129 systolic\n"
            "• Stage 1 HTN: 130–139/80–89 mmHg\n"
            "• Stage 2 HTN: ≥140/90 mmHg\n"
            "• Crisis: ≥180/120 mmHg — seek emergency care\n\n"
            "**Tips:**\n"
            "- Reduce sodium (aim <2.3g/day)\n"
            "- Follow DASH diet (fruits, vegetables, low-fat dairy)\n"
            "- Limit alcohol and caffeine\n"
            "- Take anti-hypertensive medications at the same time daily\n"
            "- Measure BP at rest, same arm, same time each day"
        ),
    },
    {
        "keywords": ["cholesterol", "hdl", "ldl", "triglyceride", "lipid", "heart"],
        "topic": "Cholesterol & Heart Health",
        "response": (
            "**Cholesterol & Heart Health**\n\n"
            "• Total cholesterol: desirable <200 mg/dL\n"
            "• LDL (bad): optimal <100 mg/dL\n"
            "• HDL (good): protective when ≥60 mg/dL\n"
            "• Triglycerides: normal <150 mg/dL\n\n"
            "**Tips:**\n"
            "- Increase omega-3 rich foods (oily fish, walnuts, flaxseed)\n"
            "- Replace saturated fats with unsaturated (olive oil, avocado)\n"
            "- Exercise 150 min/week raises HDL\n"
            "- Stop smoking to improve HDL and reduce CVD risk\n"
            "- Statins must be taken at night for best effect — don't miss doses"
        ),
    },
    {
        "keywords": ["weight", "bmi", "obese", "obesity", "overweight", "diet", "eating", "nutrition"],
        "topic": "Weight & Nutrition",
        "response": (
            "**Weight & Nutrition Guidance**\n\n"
            "• Healthy BMI: 18.5–24.9\n"
            "• Even a 5–10% weight reduction significantly improves chronic disease outcomes\n\n"
            "**Tips:**\n"
            "- Eat regular meals; avoid skipping breakfast\n"
            "- Fill half your plate with non-starchy vegetables\n"
            "- Limit processed foods, fried foods, and sugary drinks\n"
            "- Track calorie intake with a journal or app\n"
            "- Aim for 0.5–1 kg loss per week (gradual is sustainable)"
        ),
    },
    {
        "keywords": ["medication", "medicine", "drug", "pill", "dose", "prescription", "forgot", "missed"],
        "topic": "Medications",
        "response": (
            "**Medication Guidance**\n\n"
            "• Never stop prescribed medications without consulting your doctor\n"
            "• If you missed a dose: take it as soon as you remember (unless almost time for next dose)\n"
            "• Store medications as directed (away from light/heat)\n"
            "• Use a pill organiser or phone reminder to avoid missing doses\n"
            "• Report any new side effects to your pharmacist or doctor promptly\n"
            "• Never share your medications with others"
        ),
    },
    {
        "keywords": ["exercise", "activity", "workout", "walk", "gym", "physical", "movement", "cardio"],
        "topic": "Physical Activity",
        "response": (
            "**Physical Activity for Chronic Disease**\n\n"
            "• Target: 150 min/week moderate exercise (or 75 min vigorous)\n"
            "• Strength training 2×/week improves insulin sensitivity\n\n"
            "**Safe Ways to Start:**\n"
            "- Start with 10-min walks and increase gradually\n"
            "- Swimming and cycling are low-impact options for joint problems\n"
            "- Check BP and glucose before intense exercise\n"
            "- Carry a fast-acting glucose source if on insulin\n"
            "- Stop and rest if you feel chest tightness, dizziness or shortness of breath"
        ),
    },
    {
        "keywords": ["stress", "anxiety", "mental", "mood", "sleep", "rest", "tired", "fatigue"],
        "topic": "Mental Health & Sleep",
        "response": (
            "**Mental Health & Sleep**\n\n"
            "• Chronic stress raises BP, glucose and cortisol — it is a clinical concern\n"
            "• Target 7–9 hours of quality sleep per night\n\n"
            "**Tips:**\n"
            "- Practice slow breathing or mindfulness for 10 min/day\n"
            "- Keep a consistent sleep schedule (same bedtime/wake time)\n"
            "- Limit screen time 1 hour before sleep\n"
            "- Talk to your doctor about persistent anxiety or low mood\n"
            "- Social support improves chronic disease outcomes — stay connected"
        ),
    },
    {
        "keywords": ["emergency", "urgent", "chest pain", "pain", "can't breathe", "collapse", "faint", "paramedic", "ambulance"],
        "topic": "Emergency",
        "response": (
            "🚨 **This sounds like a potential emergency.**\n\n"
            "**Call emergency services (911 / 112 / 999) IMMEDIATELY if you have:**\n"
            "- Chest pain or pressure\n"
            "- Sudden difficulty breathing\n"
            "- Severe headache or vision changes\n"
            "- Sudden weakness or confusion\n"
            "- Blood glucose <54 mg/dL with confusion\n\n"
            "Do not drive yourself — wait for emergency services."
        ),
    },
]

DEFAULT_RESPONSE = (
    "I'm your Smart Health virtual assistant. I can help with questions about:\n\n"
    "- 🩸 Blood glucose & diabetes management\n"
    "- 💉 Blood pressure & hypertension\n"
    "- 🫀 Cholesterol & heart health\n"
    "- ⚖️ Weight & nutrition\n"
    "- 💊 Medications\n"
    "- 🏃 Physical activity\n"
    "- 😴 Mental health & sleep\n\n"
    "Please try asking about one of these topics and I'll provide personalised guidance."
)


def get_assistant_response(question: str) -> Dict:
    """Match question keywords and return appropriate health guidance."""
    q_lower = question.lower()

    for entry in KNOWLEDGE_BASE:
        if any(kw in q_lower for kw in entry["keywords"]):
            return {
                "topic": entry["topic"],
                "response": entry["response"],
                "disclaimer": (
                    "⚕️ This guidance is for informational purposes only. "
                    "Always consult your healthcare provider for personalised medical advice."
                ),
            }

    return {
        "topic": "General",
        "response": DEFAULT_RESPONSE,
        "disclaimer": (
            "⚕️ This guidance is for informational purposes only. "
            "Always consult your healthcare provider for personalised medical advice."
        ),
    }