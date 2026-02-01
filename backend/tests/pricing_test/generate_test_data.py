import json
import random

random.seed(42)  # reproducible results

SKILLS_POOL = [
    "Logo Design",
    "Brand Identity",
    "Graphic Design",
    "Banner Design",
    "Social Media Design",
    "Illustration",
    "UI Design",
    "UX Design",
    "Poster Design",
    "Marketing Design"
]

SENIORITY_BY_EXPERIENCE = {
    "junior": range(0, 2),
    "mid": range(2, 4),
    "senior": range(4, 7),
    "expert": range(7, 15)
}

def pick_seniority(years):
    for level, r in SENIORITY_BY_EXPERIENCE.items():
        if years in r:
            return level
    return "expert"

def generate_profile():
    years_exp = random.randint(0, 10)

    profile = {
        "monthly_rent": random.choice([0, 50, 80, 100, 150, 200, 250, 300]),
        "equipment_cost": random.randint(100, 350),
        "utilities_cost": random.randint(40, 120),
        "materials_cost": random.randint(20, 100),
        "desired_income": random.randint(600, 2200),
        "billable_hours": random.randint(70, 140),
        "profit_margin": round(random.uniform(0.08, 0.25), 2),
        "years_experience": years_exp,
        "skills": random.sample(
            SKILLS_POOL,
            k=random.randint(1, 3)
        ),
        "seniority": pick_seniority(years_exp)
    }

    return profile

def generate_dataset(n=100):
    return [generate_profile() for _ in range(n)]

if __name__ == "__main__":
    data = generate_dataset(100)

    with open("freelancer_pricing_test_data.json", "w") as f:
        json.dump(data, f, indent=2)

    print("Generated 100 freelancer pricing profiles → freelancer_pricing_test_data.json")
