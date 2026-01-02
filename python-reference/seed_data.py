"""
Food Data Seeder
Original Python implementation for seeding the vector database with food data.

This script demonstrates how food items were indexed into Upstash Vector
during Weeks 2-3 of the course.
"""

import os
from dotenv import load_dotenv
from upstash_vector import Index

# Load environment variables
load_dotenv()

# Initialize Upstash Vector
index = Index(
    url=os.getenv("UPSTASH_VECTOR_REST_URL"),
    token=os.getenv("UPSTASH_VECTOR_REST_TOKEN")
)


# Sample food data
FOOD_ITEMS = [
    {
        "id": "apple-001",
        "data": "Apple: A crisp, sweet fruit that comes in many varieties including Gala, Fuji, and Granny Smith. Apples are high in fiber and vitamin C. They can be eaten raw, baked into pies, or made into cider.",
        "metadata": {
            "category": "fruit",
            "origin": "Central Asia",
            "season": "fall"
        }
    },
    {
        "id": "banana-001",
        "data": "Banana: A tropical fruit with yellow peel when ripe. Rich in potassium and natural sugars. Great for smoothies, baking, or eating fresh. Originally from Southeast Asia.",
        "metadata": {
            "category": "fruit",
            "origin": "Southeast Asia",
            "season": "year-round"
        }
    },
    {
        "id": "orange-001",
        "data": "Orange: A citrus fruit known for its high vitamin C content. The fruit has a thick orange peel and sweet-tart flesh. Popular for juicing and eating fresh.",
        "metadata": {
            "category": "fruit",
            "origin": "Asia",
            "season": "winter"
        }
    },
    {
        "id": "broccoli-001",
        "data": "Broccoli: A green cruciferous vegetable with dense clusters of florets. High in vitamins C and K, fiber, and antioxidants. Can be steamed, roasted, or eaten raw.",
        "metadata": {
            "category": "vegetable",
            "origin": "Mediterranean",
            "season": "fall-spring"
        }
    },
    {
        "id": "salmon-001",
        "data": "Salmon: A fatty fish rich in omega-3 fatty acids and high-quality protein. Popular preparations include grilling, baking, smoking, and raw in sushi. Wild-caught and farm-raised varieties available.",
        "metadata": {
            "category": "seafood",
            "origin": "North Atlantic/Pacific",
            "season": "summer"
        }
    },
    {
        "id": "quinoa-001",
        "data": "Quinoa: An ancient grain from South America that's actually a seed. Complete protein source with all nine essential amino acids. Gluten-free and versatile in cooking.",
        "metadata": {
            "category": "grain",
            "origin": "Andes, South America",
            "season": "year-round"
        }
    },
    {
        "id": "avocado-001",
        "data": "Avocado: A creamy fruit with a large pit, known for healthy monounsaturated fats. Popular in guacamole, toast toppings, and salads. Originally from Mexico.",
        "metadata": {
            "category": "fruit",
            "origin": "Mexico",
            "season": "year-round"
        }
    },
    {
        "id": "chicken-001",
        "data": "Chicken: Versatile poultry that's a lean source of protein. Can be grilled, roasted, fried, or stewed. White meat (breast) is lower in fat than dark meat (thighs, legs).",
        "metadata": {
            "category": "poultry",
            "origin": "Southeast Asia",
            "season": "year-round"
        }
    },
    {
        "id": "spinach-001",
        "data": "Spinach: A leafy green vegetable packed with iron, vitamins A and K, and antioxidants. Can be eaten raw in salads or cooked. Originally from Persia.",
        "metadata": {
            "category": "vegetable",
            "origin": "Persia",
            "season": "spring-fall"
        }
    },
    {
        "id": "mango-001",
        "data": "Mango: A sweet tropical fruit with golden-orange flesh. Known as the 'king of fruits' in South Asia. Rich in vitamins A and C. Popular fresh, in smoothies, and desserts.",
        "metadata": {
            "category": "fruit",
            "origin": "South Asia",
            "season": "summer"
        }
    }
]


def seed_database():
    """
    Seed the vector database with food items.
    Uses Upstash's automatic embedding feature.
    """
    print(f"Seeding database with {len(FOOD_ITEMS)} food items...")
    
    for item in FOOD_ITEMS:
        try:
            index.upsert(
                vectors=[{
                    "id": item["id"],
                    "data": item["data"],
                    "metadata": item["metadata"]
                }]
            )
            print(f"  ✓ Added: {item['id']}")
        except Exception as e:
            print(f"  ✗ Failed to add {item['id']}: {e}")
    
    print("\nSeeding complete!")
    
    # Verify by checking index info
    info = index.info()
    print(f"Total vectors in index: {info.vector_count}")


def clear_database():
    """
    Clear all vectors from the database.
    Use with caution!
    """
    print("Clearing database...")
    index.reset()
    print("Database cleared!")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--clear":
        clear_database()
    else:
        seed_database()
