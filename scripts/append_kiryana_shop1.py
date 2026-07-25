#!/usr/bin/env python3
"""Append 50 more kiryana categories + 1000 products for shop_id=1 (keeps existing data)."""

from __future__ import annotations

import random
import subprocess
import sys
from datetime import datetime

SHOP_ID = 1
EXTRA_PRODUCTS = 1000
NOW = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
RNG = random.Random(99)

# 50 additional general-store categories
EXTRA_CATEGORIES: list[tuple] = [
    (
        "Attar & Fragrance",
        "attar-fragrance",
        "ATR",
        [
            ("Attar Roll-On", ["6ml", "12ml"], 150, 650),
            ("Room Freshener", ["300ml", "500ml"], 220, 480),
            ("Car Freshener", ["Single"], 120, 280),
            ("Perfume Spray", ["50ml", "100ml"], 450, 1800),
        ],
    ),
    (
        "Incense & Agarbatti",
        "incense-agarbatti",
        "INC",
        [
            ("Agarbatti Pack", ["Small", "Large"], 80, 250),
            ("Dhoop Sticks", ["Pack"], 100, 220),
            ("Loban Pack", ["50g", "100g"], 120, 280),
            ("Camphor Tablets", ["Pack"], 60, 150),
        ],
    ),
    (
        "Prayer & Religious",
        "prayer-religious",
        "PRY",
        [
            ("Prayer Mat", ["Single"], 450, 1800),
            ("Tasbeeh", ["Plastic", "Wooden"], 80, 350),
            ("Miswak Pack", ["Pack"], 40, 120),
            ("Quran Stand", ["Single"], 350, 900),
        ],
    ),
    (
        "Dates & Iftar Items",
        "dates-iftar-items",
        "DTE",
        [
            ("Khajoor Dates", ["250g", "500g", "1kg"], 280, 1200),
            ("Ajwa Dates Box", ["250g", "500g"], 650, 1400),
            ("Iftar Dates Mix", ["500g"], 450, 700),
            ("Date Syrup", ["400g"], 350, 520),
        ],
    ),
    (
        "Seasonal Ghee Products",
        "seasonal-ghee-products",
        "SGH",
        [
            ("Desi White Butter", ["250g", "500g"], 280, 650),
            ("Makhan Pack", ["200g"], 220, 320),
            ("Pure Cow Ghee", ["500g", "1kg"], 950, 2100),
        ],
    ),
    (
        "Pickle & Chutney Extra",
        "pickle-chutney-extra",
        "PCK",
        [
            ("Garlic Pickle", ["400g"], 220, 320),
            ("Lemon Pickle", ["400g"], 200, 300),
            ("Green Chutney", ["200g"], 120, 180),
            ("Imli Sauce", ["300g"], 150, 240),
            ("Mint Sauce", ["200g"], 130, 200),
        ],
    ),
    (
        "Ready to Cook",
        "ready-to-cook",
        "RTC",
        [
            ("Biryani Kit", ["Pack"], 350, 650),
            ("Karahi Kit", ["Pack"], 320, 580),
            ("Haleem Mix", ["Pack"], 280, 480),
            ("Pulao Mix", ["Pack"], 250, 420),
            ("Soup Mix", ["Pack"], 80, 180),
        ],
    ),
    (
        "Ready to Eat",
        "ready-to-eat",
        "RTE",
        [
            ("Canned Curry", ["400g"], 320, 520),
            ("Heat & Eat Daal", ["Pack"], 180, 320),
            ("Instant Khichdi", ["Pack"], 150, 280),
            ("Ready Paratha Wrap", ["Pack"], 220, 380),
        ],
    ),
    (
        "Breakfast Spreads",
        "breakfast-spreads",
        "SPR",
        [
            ("Peanut Butter", ["340g", "510g"], 450, 850),
            ("Chocolate Spread", ["350g"], 420, 620),
            ("Cheese Spread", ["200g"], 280, 420),
            ("Honey Butter Mix", ["250g"], 350, 480),
        ],
    ),
    (
        "Cereal Bars & Energy",
        "cereal-bars-energy",
        "CBR",
        [
            ("Protein Bar", ["Single", "Box of 6"], 180, 950),
            ("Granola Bar", ["Pack of 5"], 280, 450),
            ("Energy Bites", ["Pack"], 220, 380),
        ],
    ),
    (
        "Nuts Roasted",
        "nuts-roasted",
        "NTR",
        [
            ("Roasted Almonds", ["100g", "250g"], 350, 850),
            ("Roasted Cashew", ["100g", "250g"], 400, 950),
            ("Salted Peanuts", ["100g", "250g"], 80, 220),
            ("Masala Peanuts", ["100g", "250g"], 90, 250),
        ],
    ),
    (
        "Seeds & Superfoods",
        "seeds-superfoods",
        "SED",
        [
            ("Chia Seeds", ["100g", "250g"], 280, 650),
            ("Flax Seeds", ["200g", "500g"], 180, 420),
            ("Pumpkin Seeds", ["100g", "250g"], 250, 580),
            ("Sunflower Seeds", ["100g", "250g"], 120, 280),
            ("Sesame Seeds", ["200g"], 150, 220),
        ],
    ),
    (
        "Olive & Specialty Oils",
        "olive-specialty-oils",
        "OSP",
        [
            ("Extra Virgin Olive Oil", ["250ml", "500ml", "1L"], 650, 3200),
            ("Coconut Oil", ["200ml", "500ml"], 350, 850),
            ("Sesame Oil", ["200ml"], 280, 420),
            ("Avocado Oil", ["250ml"], 1200, 1800),
        ],
    ),
    (
        "Vinegar & Dressings",
        "vinegar-dressings",
        "VNG",
        [
            ("Apple Cider Vinegar", ["500ml", "1L"], 350, 750),
            ("White Vinegar", ["800ml"], 120, 180),
            ("Salad Dressing", ["250ml"], 280, 450),
            ("Balsamic Vinegar", ["250ml"], 650, 950),
        ],
    ),
    (
        "Soup & Broth",
        "soup-broth",
        "SUP",
        [
            ("Chicken Soup Pack", ["Pack"], 80, 180),
            ("Vegetable Soup", ["Pack"], 70, 150),
            ("Tomato Soup", ["Pack"], 80, 160),
            ("Bone Broth", ["Pack"], 220, 380),
        ],
    ),
    (
        "Baking Chocolate",
        "baking-chocolate",
        "BCH",
        [
            ("Dark Compound Chocolate", ["200g", "500g"], 280, 650),
            ("Milk Compound Chocolate", ["200g", "500g"], 260, 620),
            ("Chocolate Chips", ["200g"], 320, 450),
            ("Cocoa Butter", ["100g"], 350, 480),
        ],
    ),
    (
        "Party Supplies",
        "party-supplies",
        "PTY",
        [
            ("Paper Plates Pack", ["Pack of 50"], 180, 350),
            ("Paper Cups Pack", ["Pack of 50"], 150, 320),
            ("Birthday Candles", ["Pack"], 80, 180),
            ("Party Balloons", ["Pack"], 120, 280),
            ("Gift Wrap Roll", ["Single"], 150, 350),
        ],
    ),
    (
        "Disposable Tableware",
        "disposable-tableware",
        "DSP",
        [
            ("Foam Plates", ["Pack of 25"], 150, 280),
            ("Plastic Spoons", ["Pack of 50"], 80, 160),
            ("Plastic Forks", ["Pack of 50"], 80, 160),
            ("Food Containers", ["Pack of 10"], 180, 350),
            ("Straws Pack", ["Pack"], 60, 120),
        ],
    ),
    (
        "Kitchen Tools",
        "kitchen-tools",
        "KTN",
        [
            ("Kitchen Knife", ["Single"], 250, 850),
            ("Chopping Board", ["Small", "Large"], 280, 750),
            ("Peeler", ["Single"], 80, 180),
            ("Whisk", ["Single"], 120, 250),
            ("Measuring Cups", ["Set"], 220, 450),
            ("Spatula Set", ["Set"], 180, 380),
        ],
    ),
    (
        "Cookware Basics",
        "cookware-basics",
        "CWK",
        [
            ("Frying Pan", ["Small", "Medium"], 650, 1800),
            ("Saucepan", ["1.5L", "3L"], 550, 1600),
            ("Pressure Cooker Gasket", ["Single"], 180, 350),
            ("Steel Bowl Set", ["Set of 3"], 450, 950),
        ],
    ),
    (
        "Water Storage",
        "water-storage",
        "WST",
        [
            ("Water Cooler Bottle", ["19L"], 450, 850),
            ("Water Dispenser Tap", ["Single"], 280, 550),
            ("Water Can", ["10L", "20L"], 350, 750),
            ("Ice Tray", ["Single"], 80, 180),
        ],
    ),
    (
        "Thermos & Flasks",
        "thermos-flasks",
        "TMS",
        [
            ("Steel Flask", ["500ml", "1L"], 650, 1800),
            ("Kids Water Bottle", ["400ml"], 350, 750),
            ("Travel Mug", ["350ml"], 450, 950),
            ("Hot Pot", ["1.5L"], 850, 1600),
        ],
    ),
    (
        "Lighting & Bulbs Extra",
        "lighting-bulbs-extra",
        "LGT",
        [
            ("LED Tube Light", ["2ft", "4ft"], 450, 950),
            ("Night Lamp", ["Single"], 280, 650),
            ("Rechargeable Emergency Light", ["Single"], 850, 2200),
            ("Switch Board", ["Single"], 180, 450),
        ],
    ),
    (
        "Mobile Accessories",
        "mobile-accessories",
        "MOB",
        [
            ("Phone Cover", ["Universal"], 250, 850),
            ("Tempered Glass", ["Universal"], 180, 450),
            ("Power Bank", ["10000mAh", "20000mAh"], 1500, 4500),
            ("Earphones Wired", ["Single"], 350, 950),
            ("Bluetooth Earbuds", ["Single"], 1200, 3500),
            ("Car Phone Holder", ["Single"], 280, 650),
        ],
    ),
    (
        "Computer Accessories",
        "computer-accessories",
        "CMP",
        [
            ("USB Flash Drive", ["16GB", "32GB", "64GB"], 450, 1800),
            ("Mouse Wired", ["Single"], 450, 950),
            ("Keyboard", ["Single"], 850, 2200),
            ("HDMI Cable", ["1.5m", "3m"], 350, 850),
            ("Laptop Stand", ["Single"], 1200, 2800),
        ],
    ),
    (
        "School Supplies Extra",
        "school-supplies-extra",
        "SCH",
        [
            ("Geometry Box", ["Single"], 250, 550),
            ("Color Pencils", ["12 pcs", "24 pcs"], 180, 450),
            ("Marker Pack", ["Pack of 4"], 150, 320),
            ("School Bag Mini", ["Single"], 850, 2200),
            ("Water Color Set", ["Single"], 280, 650),
            ("Chart Paper Pack", ["Pack"], 80, 180),
        ],
    ),
    (
        "Art & Craft",
        "art-craft",
        "ART",
        [
            ("Craft Glue", ["100ml"], 80, 160),
            ("Colored Paper Pack", ["Pack"], 120, 280),
            ("Scissors Kids", ["Single"], 100, 220),
            ("Clay Pack", ["Pack"], 150, 350),
            ("Sticker Sheet", ["Pack"], 60, 150),
        ],
    ),
    (
        "Gift Items",
        "gift-items",
        "GFT",
        [
            ("Gift Card Holder", ["Single"], 80, 180),
            ("Photo Frame Small", ["Single"], 350, 850),
            ("Keychain Pack", ["Pack"], 100, 250),
            ("Mug Gift", ["Single"], 280, 650),
            ("Soft Toy Mini", ["Single"], 350, 950),
        ],
    ),
    (
        "Toys & Kids",
        "toys-kids",
        "TOY",
        [
            ("Soft Ball", ["Single"], 180, 450),
            ("Building Blocks Mini", ["Pack"], 450, 1200),
            ("Puzzle Pack", ["Single"], 280, 750),
            ("Remote Car Mini", ["Single"], 850, 2200),
            ("Doll Mini", ["Single"], 350, 950),
        ],
    ),
    (
        "Sports Basics",
        "sports-basics",
        "SPT",
        [
            ("Badminton Shuttle", ["Pack of 3"], 180, 350),
            ("Skipping Rope", ["Single"], 220, 450),
            ("Cricket Tennis Ball", ["Single"], 80, 180),
            ("Yoga Mat Basic", ["Single"], 850, 1800),
            ("Water Sports Bottle", ["750ml"], 350, 750),
        ],
    ),
    (
        "Travel Essentials",
        "travel-essentials",
        "TRV",
        [
            ("Travel Pouch", ["Single"], 280, 650),
            ("Neck Pillow", ["Single"], 650, 1400),
            ("Luggage Lock", ["Single"], 250, 550),
            ("Travel Adapter", ["Single"], 450, 950),
            ("Eye Mask", ["Single"], 120, 280),
        ],
    ),
    (
        "Umbrella & Rainwear",
        "umbrella-rainwear",
        "UMB",
        [
            ("Umbrella Foldable", ["Single"], 450, 1200),
            ("Raincoat Adult", ["Single"], 650, 1600),
            ("Raincoat Kids", ["Single"], 450, 950),
            ("Rain Boots Kids", ["Pair"], 550, 1200),
        ],
    ),
    (
        "Footwear Basics",
        "footwear-basics",
        "FWR",
        [
            ("Slippers Men", ["Pair"], 350, 950),
            ("Slippers Women", ["Pair"], 350, 950),
            ("Kids Sandals", ["Pair"], 280, 750),
            ("Socks Pack", ["3 Pair"], 220, 480),
            ("Shoe Polish", ["Tin"], 80, 180),
        ],
    ),
    (
        "Apparel Basics",
        "apparel-basics",
        "APL",
        [
            ("Vest Pack Men", ["Pack of 2"], 350, 750),
            ("Handkerchief Pack", ["Pack of 3"], 120, 280),
            ("Cap Basic", ["Single"], 250, 650),
            ("Scarf", ["Single"], 280, 750),
            ("Apron Kitchen", ["Single"], 350, 750),
        ],
    ),
    (
        "Sewing Needs",
        "sewing-needs",
        "SEW",
        [
            ("Sewing Thread Pack", ["Pack"], 80, 180),
            ("Needle Pack", ["Pack"], 40, 100),
            ("Buttons Pack", ["Pack"], 50, 120),
            ("Measuring Tape", ["Single"], 60, 150),
            ("Safety Pins Pack", ["Pack"], 40, 90),
        ],
    ),
    (
        "Hardware Basics",
        "hardware-basics",
        "HRD",
        [
            ("Screwdriver Set", ["Set"], 350, 850),
            ("Hammer Small", ["Single"], 450, 950),
            ("Nails Pack", ["Pack"], 80, 180),
            ("Duct Tape", ["Roll"], 150, 320),
            ("Cable Ties Pack", ["Pack"], 80, 180),
            ("Padlock", ["Small", "Medium"], 220, 650),
        ],
    ),
    (
        "Garden Basics",
        "garden-basics",
        "GRD",
        [
            ("Plant Fertilizer", ["500g", "1kg"], 180, 450),
            ("Garden Gloves", ["Pair"], 180, 350),
            ("Watering Can", ["5L"], 450, 850),
            ("Seed Pack Mixed", ["Pack"], 80, 220),
            ("Plant Pot Plastic", ["Small", "Medium"], 120, 350),
        ],
    ),
    (
        "Auto Care",
        "auto-care",
        "AUT",
        [
            ("Car Shampoo", ["500ml"], 350, 650),
            ("Dashboard Polish", ["300ml"], 320, 550),
            ("Tire Shine", ["300ml"], 280, 480),
            ("Engine Oil Top-Up", ["1L"], 850, 1600),
            ("Car Tissue Box", ["Box"], 180, 320),
            ("Microfiber Cloth", ["Pack of 2"], 220, 420),
        ],
    ),
    (
        "Bike Care",
        "bike-care",
        "BKE2",
        [
            ("Chain Lube", ["100ml"], 180, 320),
            ("Bike Polish", ["200ml"], 220, 380),
            ("Helmet Cleaning Wipe", ["Pack"], 150, 280),
            ("Bike Cover", ["Single"], 850, 1800),
        ],
    ),
    (
        "First Aid Extra",
        "first-aid-extra",
        "FAD",
        [
            ("First Aid Kit Mini", ["Single"], 450, 950),
            ("Adhesive Bandage", ["Pack"], 80, 180),
            ("Antiseptic Cream", ["20g"], 120, 220),
            ("Hot Water Bottle", ["Single"], 350, 750),
            ("Ice Pack Gel", ["Single"], 220, 420),
        ],
    ),
    (
        "Vitamins & Supplements",
        "vitamins-supplements",
        "VIT",
        [
            ("Vitamin C Tablets", ["Bottle"], 350, 850),
            ("Calcium Tablets", ["Bottle"], 400, 950),
            ("Omega-3 Capsules", ["Bottle"], 650, 1600),
            ("Protein Powder Mini", ["250g", "500g"], 1200, 2800),
            ("Electrolyte Powder", ["Pack"], 180, 350),
        ],
    ),
    (
        "Diabetic Care",
        "diabetic-care",
        "DIA",
        [
            ("Sugar Free Sweetener", ["Pack"], 280, 550),
            ("Diabetic Cookies", ["Pack"], 250, 450),
            ("Sugar Free Juice", ["1L"], 280, 420),
            ("Glucose Monitor Strips", ["Pack"], 850, 1800),
        ],
    ),
    (
        "Feminine Care",
        "feminine-care",
        "FEM",
        [
            ("Sanitary Pads", ["Regular", "Overnight", "Wings"], 180, 450),
            ("Panty Liners", ["Pack"], 150, 280),
            ("Intimate Wash", ["200ml"], 350, 650),
            ("Feminine Wipes", ["Pack"], 220, 380),
        ],
    ),
    (
        "Men Grooming",
        "men-grooming",
        "MGR",
        [
            ("Shaving Cream", ["60g", "100g"], 120, 280),
            ("Razor Disposable", ["Pack of 5"], 150, 320),
            ("After Shave Lotion", ["100ml"], 280, 550),
            ("Beard Oil", ["30ml"], 350, 750),
            ("Hair Trimmer Comb", ["Single"], 180, 350),
        ],
    ),
    (
        "Laundry Care Extra",
        "laundry-care-extra",
        "LND",
        [
            ("Stain Remover", ["200ml"], 280, 480),
            ("Color Catcher Sheets", ["Pack"], 350, 650),
            ("Ironing Spray", ["300ml"], 220, 380),
            ("Clothes Hanger Pack", ["Pack of 6"], 250, 480),
            ("Laundry Basket Small", ["Single"], 450, 950),
        ],
    ),
    (
        "Home Fragrance Extra",
        "home-fragrance-extra",
        "HFR",
        [
            ("Scented Candle", ["Single"], 280, 650),
            ("Diffuser Oil", ["30ml"], 350, 750),
            ("Potpourri Pack", ["Pack"], 220, 420),
            ("Incense Cone Pack", ["Pack"], 120, 250),
        ],
    ),
    (
        "Storage & Organizers",
        "storage-organizers",
        "ORG",
        [
            ("Drawer Organizer", ["Single"], 350, 850),
            ("Shoe Rack Mini", ["Single"], 850, 1800),
            ("Hanging Closet Organizer", ["Single"], 650, 1400),
            ("Jewelry Box Small", ["Single"], 450, 950),
            ("Cable Organizer", ["Pack"], 180, 350),
        ],
    ),
    (
        "Cleaning Cloths Extra",
        "cleaning-cloths-extra",
        "CCL",
        [
            ("Microfiber Mop Refill", ["Single"], 280, 550),
            ("Dusting Cloth Pack", ["Pack of 5"], 180, 350),
            ("Kitchen Sponge Pack", ["Pack of 6"], 120, 250),
            ("Steel Scrubber", ["Pack of 3"], 80, 160),
            ("Window Wiper", ["Single"], 350, 750),
        ],
    ),
    (
        "Paper Goods Extra",
        "paper-goods-extra",
        "PPR",
        [
            ("Baking Paper Roll", ["Roll"], 220, 420),
            ("Butter Paper Pack", ["Pack"], 120, 250),
            ("Greaseproof Paper", ["Pack"], 150, 280),
            ("Cash Register Roll", ["Pack of 10"], 350, 750),
            ("A4 Paper Ream", ["500 sheets"], 850, 1400),
        ],
    ),
    (
        "Festival Essentials",
        "festival-essentials",
        "FST",
        [
            ("Diyas Pack", ["Pack of 12"], 150, 350),
            ("Fairy Lights", ["Single"], 450, 1200),
            ("Mehndi Cone", ["Pack of 3"], 120, 280),
            ("Bunting Flags", ["Pack"], 180, 420),
            ("Sweet Box Empty", ["Single"], 80, 220),
        ],
    ),
]

CATEGORY_BRANDS = {
    "Attar & Fragrance": ["Al-Rehab", "Ajmal", "Local Attar", "Air Wick"],
    "Incense & Agarbatti": ["Cycle", "Mangaldeep", "Local", "Zed Black"],
    "Prayer & Religious": ["Madina", "Local Craft", "Noor"],
    "Dates & Iftar Items": ["Saudi", "Ajwa House", "Kimia", "Local Premium"],
    "Seasonal Ghee Products": ["Nurpur", "Desi Farm", "Haleeb", "Local"],
    "Pickle & Chutney Extra": ["National", "Shangrila", "Ahmed", "Mitchell's"],
    "Ready to Cook": ["Shan", "National", "Knorr", "Recipe"],
    "Ready to Eat": ["National", "Young's", "K&Ns", "Menu"],
    "Breakfast Spreads": ["Skippy", "Nutella", "Young's", "Nurpur"],
    "Cereal Bars & Energy": ["Nature Valley", "Nestle", "Quaker", "Local"],
    "Nuts Roasted": ["Dry Fruit House", "Nutri", "Kashmir", "Premium"],
    "Seeds & Superfoods": ["Nutri", "Organic Farm", "Health Pack"],
    "Olive & Specialty Oils": ["Borges", "Figaro", "Canolive", "Sufi"],
    "Vinegar & Dressings": ["American Garden", "Heinz", "Local", "Young's"],
    "Soup & Broth": ["Knorr", "Nestle", "National", "Maggi"],
    "Baking Chocolate": ["Bake Parlor", "Cadbury", "Rafhan", "Local"],
    "Party Supplies": ["PartyTime", "Local", "Celebrate"],
    "Disposable Tableware": ["Local", "EcoPack", "HomeCare"],
    "Kitchen Tools": ["Prestige", "Local Steel", "HomeWare"],
    "Cookware Basics": ["Chef", "NonStick Pro", "Local"],
    "Water Storage": ["Loyal", "HomeCare", "Cooler Pro"],
    "Thermos & Flasks": ["Olympus", "Tiger", "Local Steel"],
    "Lighting & Bulbs Extra": ["Philips", "Osaka", "Tufail", "Local"],
    "Mobile Accessories": ["Baseus", "Local", "Anker", "Remax"],
    "Computer Accessories": ["Logitech", "Local", "HP", "Dell"],
    "School Supplies Extra": ["Dollar", "Piano", "Nafees", "Oxford"],
    "Art & Craft": ["Crayola", "Local Craft", "Faber"],
    "Gift Items": ["Gift House", "Local", "Surprise"],
    "Toys & Kids": ["KidsZone", "Local Toy", "FunTime"],
    "Sports Basics": ["Sports Pro", "Local", "Fitness"],
    "Travel Essentials": ["TravelMate", "Local", "GoPack"],
    "Umbrella & Rainwear": ["RainPro", "Local", "DryDay"],
    "Footwear Basics": ["Bata", "Servis", "Local", "Relaxo"],
    "Apparel Basics": ["Local Wear", "Cotton Soft", "Basic"],
    "Sewing Needs": ["Coats", "Local", "TailorPack"],
    "Hardware Basics": ["ToolPro", "Local Hardware", "FixIt"],
    "Garden Basics": ["GreenThumb", "Local Garden", "PlantCare"],
    "Auto Care": ["Turtle Wax", "3M", "Local Auto", "Shell"],
    "Bike Care": ["Motul", "Local Bike", "ChainCare"],
    "First Aid Extra": ["Johnson's", "Savlon", "Local Care"],
    "Vitamins & Supplements": ["Nature Made", "Local Pharma", "HealthPlus"],
    "Diabetic Care": ["SugarFree", "Local Care", "DiabeticPlus"],
    "Feminine Care": ["Always", "Stayfree", "Whisper", "Local"],
    "Men Grooming": ["Gillette", "Nivea Men", "Local", "Beardo"],
    "Laundry Care Extra": ["Vanish", "Local Care", "IronFresh"],
    "Home Fragrance Extra": ["Air Wick", "Glade", "Local Scent"],
    "Storage & Organizers": ["HomeOrg", "Loyal", "SpaceSave"],
    "Cleaning Cloths Extra": ["Scotch-Brite", "Local Clean", "MicroPro"],
    "Paper Goods Extra": ["PaperTech", "Local Paper", "OfficePack"],
    "Festival Essentials": ["Festive", "Local Decor", "Celebrate"],
}

GENERIC_BRANDS = ["National", "Local", "Store Pack", "Premium", "Family"]


def ean13(counter: int) -> str:
    body = f"890{counter:09d}"[:12]
    digits = [int(d) for d in body]
    checksum = (10 - (sum(digits[::2]) + sum(d * 3 for d in digits[1::2])) % 10) % 10
    return body + str(checksum)


def sql_str(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "''") + "'"


def mysql(sql: str) -> str:
    result = subprocess.run(
        [
            "docker",
            "compose",
            "exec",
            "-T",
            "mysql",
            "mysql",
            "-upos_user",
            "-ppos_secret",
            "pos_system",
            "-N",
            "-e",
            sql,
        ],
        cwd="/home/qt-dev/Projects/pos-system",
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr or result.stdout or "mysql failed")
    return result.stdout


def build_catalog() -> list[tuple[str, str, list[tuple]]]:
    catalog = []
    for name, slug, prefix, templates in EXTRA_CATEGORIES:
        brands = CATEGORY_BRANDS.get(name, GENERIC_BRANDS)
        variants: list[tuple] = []
        for base, sizes, pmin, pmax in templates:
            for size_index, size in enumerate(sizes):
                if len(sizes) == 1:
                    lo, hi = pmin, pmax
                else:
                    step = (pmax - pmin) / max(len(sizes) - 1, 1)
                    center = pmin + step * size_index
                    spread = max(step * 0.25, (pmax - pmin) * 0.05)
                    lo = max(pmin, center - spread)
                    hi = min(pmax, center + spread)
                chosen = list(dict.fromkeys([RNG.choice(brands), RNG.choice(brands), RNG.choice(brands)]))
                for brand_name in chosen[:2]:
                    label = f"{brand_name} {base} {size}"
                    price = round(RNG.uniform(lo, hi), 2)
                    cost = round(price * RNG.uniform(0.65, 0.88), 2)
                    stock = RNG.randint(8, 220)
                    variants.append((label, price, cost, stock))
        catalog.append((name, prefix, variants))
    return catalog


def expand_to_target(catalog: list[tuple[str, str, list[tuple]]], target: int) -> list[tuple]:
    flat: list[tuple] = []
    for cat_name, prefix, variants in catalog:
        for idx, (label, price, cost, stock) in enumerate(variants, start=1):
            flat.append((cat_name, prefix, idx, label, price, cost, stock))

    next_extra = 1
    while len(flat) < target:
        cat_name, prefix, variants = catalog[next_extra % len(catalog)]
        base_label, price, cost, stock = RNG.choice(variants)
        flat.append(
            (
                cat_name,
                prefix,
                20_000 + next_extra,
                f"{base_label} Pack {next_extra}",
                round(price * RNG.uniform(0.95, 1.08), 2),
                round(cost * RNG.uniform(0.95, 1.05), 2),
                RNG.randint(8, 220),
            )
        )
        next_extra += 1
    return flat[:target]


def next_barcode_counter() -> int:
    raw = mysql("SELECT barcode FROM products WHERE barcode LIKE '890%' ORDER BY barcode DESC LIMIT 1;").strip()
    if not raw:
        return 2_000_001
    # barcode is 13 digits; body is first 12
    body = raw[:12]
    try:
        n = int(body[3:])  # after 890
    except ValueError:
        n = 2_000_000
    return n + 1


def next_sku_counters() -> dict[str, int]:
    rows = mysql(
        "SELECT sku FROM products WHERE shop_id=%d AND sku REGEXP '^[A-Z0-9]+-[0-9]+$';" % SHOP_ID
    ).strip().splitlines()
    counters: dict[str, int] = {}
    for sku in rows:
        if not sku or "-" not in sku:
            continue
        prefix, num = sku.rsplit("-", 1)
        if num.isdigit():
            counters[prefix] = max(counters.get(prefix, 0), int(num))
    return counters


def main() -> int:
    if mysql(f"SELECT id FROM shops WHERE id={SHOP_ID}").strip() != str(SHOP_ID):
        print(f"Shop {SHOP_ID} not found", file=sys.stderr)
        return 1

    if len(EXTRA_CATEGORIES) != 50:
        print(f"Expected 50 categories, got {len(EXTRA_CATEGORIES)}", file=sys.stderr)
        return 1

    existing_slugs = {
        line.strip()
        for line in mysql(f"SELECT slug FROM categories WHERE shop_id={SHOP_ID};").splitlines()
        if line.strip()
    }

    print(f"Adding {len(EXTRA_CATEGORIES)} categories...")
    cat_values = []
    for name, slug, _prefix, _templates in EXTRA_CATEGORIES:
        if slug in existing_slugs:
            raise RuntimeError(f"Slug already exists: {slug}")
        cat_values.append(
            f"({SHOP_ID}, {sql_str(name)}, {sql_str(slug)}, 1, {sql_str(NOW)}, {sql_str(NOW)})"
        )
    mysql(
        "INSERT INTO categories (shop_id, name, slug, is_active, created_at, updated_at) VALUES "
        + ",\n".join(cat_values)
        + ";"
    )

    rows = mysql(
        f"SELECT id, name FROM categories WHERE shop_id={SHOP_ID} ORDER BY id;"
    ).strip().splitlines()
    cat_ids = {name: int(cid) for cid, name in (line.split("\t") for line in rows if line)}
    print(f"Total categories now: {len(cat_ids)}")

    products = expand_to_target(build_catalog(), EXTRA_PRODUCTS)
    sku_counters = next_sku_counters()
    barcode_counter = next_barcode_counter()
    print(f"Adding {len(products)} products (barcode start {barcode_counter})...")

    batch: list[str] = []
    batch_size = 200
    inserted = 0
    for cat_name, prefix, _seq, label, price, cost, stock in products:
        sku_counters[prefix] = sku_counters.get(prefix, 0) + 1
        sku = f"{prefix}-{sku_counters[prefix]:04d}"
        barcode = ean13(barcode_counter)
        barcode_counter += 1
        category_id = cat_ids[cat_name]
        batch.append(
            "("
            + ", ".join(
                [
                    str(SHOP_ID),
                    str(category_id),
                    sql_str(label),
                    sql_str(sku),
                    sql_str(barcode),
                    "NULL",
                    f"{price:.2f}",
                    f"{cost:.2f}",
                    str(stock),
                    "1",
                    sql_str(NOW),
                    sql_str(NOW),
                ]
            )
            + ")"
        )
        if len(batch) >= batch_size:
            mysql(
                "INSERT INTO products "
                "(shop_id, category_id, name, sku, barcode, image, price, cost, stock, is_active, created_at, updated_at) VALUES "
                + ",\n".join(batch)
                + ";"
            )
            inserted += len(batch)
            print(f"  inserted {inserted}/{len(products)}")
            batch = []

    if batch:
        mysql(
            "INSERT INTO products "
            "(shop_id, category_id, name, sku, barcode, image, price, cost, stock, is_active, created_at, updated_at) VALUES "
            + ",\n".join(batch)
            + ";"
        )
        inserted += len(batch)
        print(f"  inserted {inserted}/{len(products)}")

    summary = mysql(
        f"""
        SELECT
          (SELECT COUNT(*) FROM categories WHERE shop_id={SHOP_ID}) AS categories,
          (SELECT COUNT(*) FROM products WHERE shop_id={SHOP_ID}) AS products;
        """
    ).strip()
    print("Done:", summary)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
