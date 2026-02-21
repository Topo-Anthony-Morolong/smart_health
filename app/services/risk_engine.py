import joblib
import os
import numpy as np

BASE_DIR = os.path.dirname(__file__)

model = joblib.load(os.path.join(BASE_DIR, "risk_model.joblib"))
scaler = joblib.load(os.path.join(BASE_DIR, "scaler.joblib"))


def calculate_risk(patient_data):
    features = np.array([[
        patient_data.pregnancies,
        patient_data.glucose,
        patient_data.blood_pressure,
        patient_data.skin_thickness,
        patient_data.insulin,
        patient_data.bmi,
        patient_data.diabetes_pedigree,
        patient_data.age
    ]])

    scaled_features = scaler.transform(features)
    probability = model.predict_proba(scaled_features)[0][1]

    risk_level = stratify_risk(probability)

    return {
        "risk_score": round(float(probability), 4),
        "risk_level": risk_level
    }


def stratify_risk(probability):
    if probability >= 0.7:
        return "High"
    elif probability >= 0.4:
        return "Moderate"
    else:
        return "Low"