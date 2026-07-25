#!/usr/bin/env python3
"""One-off DB insert: kiryana/general-store categories + ~1000 products for shop_id=1."""

from __future__ import annotations

import random
import subprocess
import sys
from datetime import datetime

SHOP_ID = 1
PRODUCT_TARGET = 1000
NOW = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
RNG = random.Random(42)

# Typical kiryana / general store categories with product name templates.
# Each entry: (name, slug, sku_prefix, [(base_name, sizes..., price_min, price_max), ...])
CATEGORIES: list[tuple] = [
    (
        "Rice & Grains",
        "rice-grains",
        "RCE",
        [
            ("Basmati Rice", ["1kg", "5kg", "10kg", "25kg"], 220, 5200),
            ("Sella Rice", ["1kg", "5kg", "10kg"], 180, 1800),
            ("Irri-6 Rice", ["5kg", "10kg", "25kg"], 700, 3200),
            ("Broken Rice", ["5kg", "10kg"], 550, 1100),
            ("Corn Flour", ["500g", "1kg"], 90, 180),
            ("Semolina Suji", ["500g", "1kg"], 80, 160),
        ],
    ),
    (
        "Flour & Atta",
        "flour-atta",
        "FLT",
        [
            ("Wheat Atta", ["1kg", "5kg", "10kg", "20kg"], 120, 2400),
            ("Chakki Atta", ["5kg", "10kg"], 700, 1450),
            ("Maida", ["1kg", "5kg"], 110, 520),
            ("Besan", ["500g", "1kg", "5kg"], 90, 850),
            ("Gram Flour Fine", ["1kg"], 180, 220),
            ("Rice Flour", ["500g", "1kg"], 100, 200),
        ],
    ),
    (
        "Pulses & Lentils",
        "pulses-lentils",
        "DAL",
        [
            ("Moong Dal", ["500g", "1kg"], 160, 320),
            ("Masoor Dal", ["500g", "1kg"], 140, 280),
            ("Chana Dal", ["500g", "1kg"], 150, 300),
            ("Urad Dal", ["500g", "1kg"], 170, 340),
            ("White Chana", ["500g", "1kg"], 180, 360),
            ("Red Beans", ["500g", "1kg"], 200, 400),
            ("Black Beans", ["500g", "1kg"], 220, 440),
            ("Lobia", ["500g", "1kg"], 180, 360),
            ("Mix Dal", ["1kg"], 280, 320),
        ],
    ),
    (
        "Cooking Oil & Ghee",
        "cooking-oil-ghee",
        "OIL",
        [
            ("Sunflower Oil", ["1L", "3L", "5L"], 480, 2300),
            ("Canola Oil", ["1L", "5L"], 520, 2500),
            ("Soybean Oil", ["1L", "5L"], 450, 2100),
            ("Olive Oil Extra Virgin", ["250ml", "500ml", "1L"], 650, 2800),
            ("Desi Ghee", ["500g", "1kg"], 900, 1850),
            ("Banaspati Ghee", ["1kg", "5kg"], 450, 2100),
            ("Mustard Oil", ["500ml", "1L"], 350, 700),
        ],
    ),
    (
        "Sugar & Sweeteners",
        "sugar-sweeteners",
        "SGR",
        [
            ("White Sugar", ["1kg", "5kg", "10kg"], 160, 1550),
            ("Brown Sugar", ["500g", "1kg"], 120, 240),
            ("Gur Jaggery", ["500g", "1kg"], 150, 300),
            ("Caster Sugar", ["500g"], 180, 220),
            ("Icing Sugar", ["500g"], 200, 240),
            ("Stevia Pack", ["50 sachets", "100 sachets"], 350, 650),
        ],
    ),
    (
        "Salt & Spices",
        "salt-spices",
        "SPC",
        [
            ("Iodized Salt", ["800g", "1kg"], 40, 60),
            ("Rock Salt", ["500g", "1kg"], 80, 150),
            ("Red Chili Powder", ["100g", "200g", "500g"], 80, 350),
            ("Turmeric Powder", ["100g", "200g", "500g"], 70, 300),
            ("Coriander Powder", ["100g", "200g"], 60, 140),
            ("Cumin Seeds", ["100g", "200g"], 120, 240),
            ("Garam Masala", ["50g", "100g"], 80, 160),
            ("Black Pepper", ["50g", "100g"], 150, 300),
            ("Cinnamon Sticks", ["50g"], 120, 150),
            ("Cardamom Green", ["25g", "50g"], 250, 500),
            ("Cloves", ["50g"], 180, 220),
            ("Bay Leaves", ["50g"], 60, 80),
        ],
    ),
    (
        "Tea & Coffee",
        "tea-coffee",
        "TEA",
        [
            ("Black Tea", ["100g", "200g", "450g", "900g"], 180, 1400),
            ("Green Tea Bags", ["25 bags", "50 bags", "100 bags"], 250, 900),
            ("Instant Coffee", ["50g", "100g", "200g"], 350, 1200),
            ("Coffee Mix 3in1", ["20 sachets", "30 sachets"], 280, 420),
            ("Kashmiri Tea", ["200g", "450g"], 320, 700),
            ("Herbal Tea", ["20 bags", "40 bags"], 300, 550),
        ],
    ),
    (
        "Milk & Dairy",
        "milk-dairy",
        "MLK",
        [
            ("Fresh Milk Pack", ["250ml", "500ml", "1L"], 50, 180),
            ("UHT Milk", ["1L"], 220, 260),
            ("Powdered Milk", ["400g", "900g", "1.8kg"], 650, 2800),
            ("Condensed Milk", ["397g"], 280, 320),
            ("Evaporated Milk", ["170g", "410g"], 120, 280),
            ("Cream Pack", ["200ml"], 120, 150),
        ],
    ),
    (
        "Yogurt & Lassi",
        "yogurt-lassi",
        "YGT",
        [
            ("Plain Yogurt", ["400g", "1kg"], 120, 280),
            ("Sweet Yogurt", ["400g"], 150, 180),
            ("Lassi Mango", ["250ml", "500ml"], 80, 150),
            ("Lassi Sweet", ["250ml"], 70, 90),
            ("Greek Yogurt", ["150g", "400g"], 180, 420),
        ],
    ),
    (
        "Cheese & Butter",
        "cheese-butter",
        "CHS",
        [
            ("Cheddar Cheese Slice", ["100g", "200g"], 280, 520),
            ("Mozzarella Cheese", ["200g"], 450, 520),
            ("Processed Cheese", ["200g"], 320, 380),
            ("Butter Salted", ["200g"], 280, 320),
            ("Butter Unsalted", ["200g"], 300, 340),
            ("Margarine", ["250g", "500g"], 180, 340),
        ],
    ),
    (
        "Eggs",
        "eggs",
        "EGG",
        [
            ("Farm Eggs Tray", ["6 pcs", "12 pcs", "30 pcs"], 180, 900),
            ("Organic Eggs", ["6 pcs", "12 pcs"], 250, 480),
            ("Quail Eggs", ["12 pcs"], 200, 240),
        ],
    ),
    (
        "Bread & Bakery",
        "bread-bakery",
        "BRD",
        [
            ("White Bread", ["Large", "Small"], 120, 160),
            ("Brown Bread", ["Large"], 150, 180),
            ("Milk Bread", ["Large"], 140, 170),
            ("Burger Buns", ["4 pcs", "6 pcs"], 100, 150),
            ("Pizza Base", ["2 pcs"], 180, 220),
            ("Rusk Toast", ["200g", "300g"], 120, 180),
            ("Croissant Pack", ["4 pcs"], 250, 300),
        ],
    ),
    (
        "Biscuits & Cookies",
        "biscuits-cookies",
        "BSC",
        [
            ("Glucose Biscuits", ["Family Pack", "Half Roll"], 40, 120),
            ("Chocolate Cookies", ["Pack", "Family Pack"], 80, 220),
            ("Salted Biscuits", ["Pack"], 50, 80),
            ("Cream Biscuits", ["Pack", "Family Pack"], 60, 180),
            ("Digestive Biscuits", ["Pack"], 150, 200),
            ("Wafer Biscuits", ["Pack"], 70, 120),
            ("Butter Cookies", ["Tin", "Pack"], 180, 650),
        ],
    ),
    (
        "Snacks & Chips",
        "snacks-chips",
        "SNK",
        [
            ("Potato Chips", ["Small", "Medium", "Large"], 40, 180),
            ("Corn Snacks", ["Small", "Large"], 30, 100),
            ("Nimco Mix", ["200g", "500g"], 150, 350),
            ("Peanuts Salted", ["100g", "250g"], 80, 180),
            ("Popcorn", ["Pack"], 50, 90),
            ("Sev Namkeen", ["200g"], 120, 150),
            ("Papad Pack", ["100g", "200g"], 80, 150),
        ],
    ),
    (
        "Sweets & Chocolates",
        "sweets-chocolates",
        "SWT",
        [
            ("Milk Chocolate Bar", ["Small", "Large"], 80, 250),
            ("Dark Chocolate", ["100g"], 220, 320),
            ("Candy Mix", ["Pack"], 50, 120),
            ("Toffee Jar", ["Small", "Large"], 100, 350),
            ("Halwa Pack", ["250g", "500g"], 200, 450),
            ("Mithai Assorted", ["250g", "500g", "1kg"], 350, 1400),
        ],
    ),
    (
        "Dry Fruits & Nuts",
        "dry-fruits-nuts",
        "DRF",
        [
            ("Almonds", ["100g", "250g", "500g"], 350, 1600),
            ("Cashews", ["100g", "250g", "500g"], 400, 1900),
            ("Raisins", ["100g", "250g", "500g"], 150, 700),
            ("Walnuts", ["100g", "250g"], 450, 1100),
            ("Pistachios", ["100g", "250g"], 500, 1200),
            ("Dates Ajwa", ["250g", "500g"], 400, 850),
            ("Mixed Dry Fruit", ["250g", "500g"], 550, 1100),
        ],
    ),
    (
        "Soft Drinks",
        "soft-drinks",
        "SFT",
        [
            ("Cola Drink", ["250ml", "500ml", "1.5L", "2.25L"], 50, 220),
            ("Lemon Soda", ["250ml", "500ml", "1.5L"], 50, 180),
            ("Orange Soft Drink", ["250ml", "1.5L"], 50, 180),
            ("Clear Lemon Drink", ["500ml", "1.5L"], 80, 180),
            ("Diet Cola", ["330ml", "500ml"], 90, 140),
        ],
    ),
    (
        "Juices & Squashes",
        "juices-squashes",
        "JCE",
        [
            ("Mango Juice", ["200ml", "1L"], 60, 280),
            ("Orange Juice", ["200ml", "1L"], 60, 300),
            ("Apple Juice", ["200ml", "1L"], 70, 320),
            ("Mixed Fruit Juice", ["1L"], 280, 340),
            ("Lemon Squash", ["750ml", "1.5L"], 280, 520),
            ("Rooh Afza", ["800ml"], 320, 380),
            ("Jam-e-Shirin", ["800ml"], 300, 360),
        ],
    ),
    (
        "Mineral Water",
        "mineral-water",
        "WTR",
        [
            ("Mineral Water", ["500ml", "1.5L", "6L", "19L"], 40, 350),
            ("Sparkling Water", ["330ml", "500ml"], 80, 140),
            ("Kids Water Bottle", ["330ml"], 50, 70),
        ],
    ),
    (
        "Energy Drinks",
        "energy-drinks",
        "NRG",
        [
            ("Energy Drink", ["250ml", "500ml"], 180, 320),
            ("Sports Drink", ["500ml"], 150, 200),
            ("Glucose Drink", ["200ml"], 80, 120),
        ],
    ),
    (
        "Instant Noodles",
        "instant-noodles",
        "NDL",
        [
            ("Chicken Noodles", ["Single", "Family Pack"], 50, 280),
            ("Masala Noodles", ["Single", "Family Pack"], 50, 280),
            ("Cup Noodles", ["Cup"], 120, 160),
            ("Pasta Instant", ["Pack"], 80, 140),
        ],
    ),
    (
        "Breakfast Cereals",
        "breakfast-cereals",
        "CRL",
        [
            ("Corn Flakes", ["250g", "500g"], 350, 650),
            ("Oats", ["400g", "1kg"], 400, 900),
            ("Muesli", ["400g"], 650, 780),
            ("Chocolate Cereal", ["300g", "500g"], 450, 720),
            ("Kids Cereal", ["250g"], 380, 450),
        ],
    ),
    (
        "Pasta & Macaroni",
        "pasta-macaroni",
        "PST",
        [
            ("Spaghetti", ["400g", "500g"], 180, 260),
            ("Macaroni", ["400g"], 160, 200),
            ("Penne Pasta", ["400g"], 200, 240),
            ("Fusilli Pasta", ["400g"], 210, 250),
            ("Lasagna Sheets", ["250g"], 280, 320),
        ],
    ),
    (
        "Sauces & Pickles",
        "sauces-pickles",
        "SOS",
        [
            ("Tomato Ketchup", ["300g", "500g", "1kg"], 180, 450),
            ("Chili Sauce", ["300g", "500g"], 160, 300),
            ("Soy Sauce", ["150ml", "300ml"], 120, 220),
            ("Mayonnaise", ["250g", "500g"], 220, 420),
            ("Mustard Sauce", ["200g"], 180, 220),
            ("Mango Pickle", ["400g", "1kg"], 200, 450),
            ("Mixed Pickle", ["400g"], 220, 280),
            ("Vinegar", ["300ml", "800ml"], 80, 180),
        ],
    ),
    (
        "Honey & Jam",
        "honey-jam",
        "HNY",
        [
            ("Natural Honey", ["250g", "500g", "1kg"], 450, 1600),
            ("Strawberry Jam", ["450g"], 280, 340),
            ("Mixed Fruit Jam", ["450g"], 260, 320),
            ("Orange Marmalade", ["450g"], 300, 360),
            ("Chocolate Spread", ["350g"], 450, 520),
        ],
    ),
    (
        "Canned Foods",
        "canned-foods",
        "CAN",
        [
            ("Canned Tuna", ["185g"], 320, 420),
            ("Baked Beans", ["420g"], 280, 340),
            ("Canned Corn", ["340g"], 220, 280),
            ("Tomato Paste", ["400g"], 180, 240),
            ("Canned Pineapple", ["565g"], 350, 420),
            ("Chickpeas Can", ["400g"], 200, 250),
        ],
    ),
    (
        "Frozen Foods",
        "frozen-foods",
        "FRZ",
        [
            ("Frozen Paratha", ["5 pcs", "10 pcs"], 280, 520),
            ("Frozen Samosa", ["12 pcs"], 350, 420),
            ("Chicken Nuggets", ["500g", "1kg"], 650, 1200),
            ("Frozen Peas", ["500g", "1kg"], 220, 400),
            ("French Fries", ["500g", "1kg"], 350, 650),
            ("Ice Cream Cup", ["Single", "Family"], 80, 450),
        ],
    ),
    (
        "Fresh Vegetables",
        "fresh-vegetables",
        "VEG",
        [
            ("Potato", ["1kg", "5kg"], 80, 350),
            ("Onion", ["1kg", "5kg"], 90, 400),
            ("Tomato", ["1kg"], 120, 200),
            ("Green Chili", ["250g"], 40, 80),
            ("Coriander Bunch", ["Bunch"], 30, 50),
            ("Cucumber", ["1kg"], 80, 140),
            ("Carrot", ["1kg"], 100, 160),
            ("Cabbage", ["1pc"], 80, 150),
            ("Lady Finger", ["1kg"], 120, 200),
            ("Brinjal", ["1kg"], 90, 160),
        ],
    ),
    (
        "Fresh Fruits",
        "fresh-fruits",
        "FRT",
        [
            ("Banana", ["1 dozen"], 150, 250),
            ("Apple", ["1kg"], 280, 450),
            ("Orange", ["1kg"], 180, 280),
            ("Mango", ["1kg"], 200, 400),
            ("Grapes", ["1kg"], 350, 550),
            ("Watermelon", ["1pc"], 200, 450),
            ("Pomegranate", ["1kg"], 300, 500),
            ("Guava", ["1kg"], 150, 250),
        ],
    ),
    (
        "Personal Care",
        "personal-care",
        "PCR",
        [
            ("Bath Soap", ["Single", "3 Pack", "4 Pack"], 80, 320),
            ("Hand Wash", ["200ml", "500ml"], 180, 380),
            ("Body Wash", ["250ml", "400ml"], 350, 650),
            ("Talcum Powder", ["100g", "200g"], 180, 350),
            ("Deodorant Spray", ["150ml"], 350, 550),
            ("Face Wash", ["50ml", "100ml"], 220, 450),
        ],
    ),
    (
        "Oral Care",
        "oral-care",
        "ORL",
        [
            ("Toothpaste", ["70g", "100g", "150g"], 120, 280),
            ("Toothbrush", ["Single", "Family Pack"], 60, 250),
            ("Mouthwash", ["250ml", "500ml"], 280, 520),
            ("Dental Floss", ["Pack"], 180, 250),
        ],
    ),
    (
        "Hair Care",
        "hair-care",
        "HAR",
        [
            ("Shampoo", ["180ml", "340ml", "650ml"], 280, 850),
            ("Hair Conditioner", ["180ml", "340ml"], 320, 600),
            ("Hair Oil", ["100ml", "200ml", "300ml"], 150, 450),
            ("Hair Gel", ["100ml"], 180, 250),
            ("Hair Color", ["Pack"], 250, 450),
        ],
    ),
    (
        "Skin Care",
        "skin-care",
        "SKN",
        [
            ("Moisturizer Cream", ["50ml", "100ml"], 220, 480),
            ("Sunscreen Lotion", ["50ml", "100ml"], 450, 850),
            ("Face Cream", ["50g"], 280, 520),
            ("Lip Balm", ["Stick"], 120, 200),
            ("Vaseline Jelly", ["50ml", "100ml"], 150, 280),
        ],
    ),
    (
        "Baby Care",
        "baby-care",
        "BBY",
        [
            ("Baby Diapers", ["Small Pack", "Medium Pack", "Large Pack"], 450, 1800),
            ("Baby Wipes", ["Pack"], 250, 420),
            ("Baby Lotion", ["200ml"], 350, 480),
            ("Baby Powder", ["100g", "200g"], 180, 320),
            ("Baby Soap", ["Single"], 120, 180),
            ("Baby Shampoo", ["200ml"], 320, 420),
            ("Feeding Bottle", ["Single"], 350, 650),
        ],
    ),
    (
        "Soap & Detergent",
        "soap-detergent",
        "DET",
        [
            ("Laundry Detergent Powder", ["500g", "1kg", "3kg", "5kg"], 220, 1800),
            ("Liquid Detergent", ["1L", "2L"], 350, 700),
            ("Dishwash Bar", ["Single", "3 Pack"], 40, 110),
            ("Dishwash Liquid", ["500ml", "1L"], 180, 350),
            ("Fabric Softener", ["800ml", "1.5L"], 320, 580),
            ("Bleach Liquid", ["1L"], 180, 240),
        ],
    ),
    (
        "Cleaning Supplies",
        "cleaning-supplies",
        "CLN",
        [
            ("Floor Cleaner", ["1L", "2L"], 280, 520),
            ("Glass Cleaner", ["500ml"], 220, 280),
            ("Toilet Cleaner", ["500ml", "1L"], 180, 320),
            ("Phenyl", ["1L"], 150, 200),
            ("Scrub Pad", ["Pack of 3"], 80, 120),
            ("Cleaning Cloth", ["Pack of 3"], 100, 160),
            ("Broom", ["Single"], 250, 450),
            ("Mop Set", ["Single"], 650, 1200),
        ],
    ),
    (
        "Tissue & Paper",
        "tissue-paper",
        "TSP",
        [
            ("Facial Tissue Box", ["Box"], 180, 280),
            ("Toilet Paper Roll", ["4 Pack", "12 Pack"], 220, 650),
            ("Kitchen Towel", ["2 Pack", "4 Pack"], 280, 520),
            ("Paper Napkins", ["Pack"], 80, 150),
            ("Wet Tissue Pack", ["Pack"], 120, 220),
        ],
    ),
    (
        "Household Items",
        "household-items",
        "HSE",
        [
            ("Match Box", ["Pack of 10"], 40, 60),
            ("Candle Pack", ["Pack of 6"], 80, 150),
            ("Garbage Bags", ["Small", "Large"], 120, 280),
            ("Aluminum Foil", ["Roll"], 180, 320),
            ("Cling Film", ["Roll"], 150, 250),
            ("Zip Lock Bags", ["Pack"], 120, 220),
            ("Torch Light", ["Single"], 250, 650),
        ],
    ),
    (
        "Plasticware",
        "plasticware",
        "PLT",
        [
            ("Plastic Bucket", ["Small", "Medium", "Large"], 250, 850),
            ("Water Jug", ["1.5L", "2.5L"], 180, 350),
            ("Storage Box", ["Small", "Medium", "Large"], 220, 900),
            ("Lunch Box", ["Single", "Set of 3"], 180, 550),
            ("Plastic Plate Set", ["6 pcs"], 250, 400),
            ("Plastic Glass Set", ["6 pcs"], 180, 320),
        ],
    ),
    (
        "Batteries & Electrical",
        "batteries-electrical",
        "BAT",
        [
            ("AA Battery Pack", ["2 pcs", "4 pcs"], 120, 220),
            ("AAA Battery Pack", ["2 pcs", "4 pcs"], 100, 200),
            ("9V Battery", ["Single"], 180, 250),
            ("LED Bulb", ["9W", "12W", "18W"], 180, 450),
            ("Extension Board", ["3 Socket", "5 Socket"], 450, 850),
            ("Phone Charger Cable", ["USB-C", "Lightning", "Micro USB"], 250, 650),
        ],
    ),
    (
        "Stationery",
        "stationery",
        "STN",
        [
            ("Ball Pen Pack", ["10 pcs"], 80, 150),
            ("Pencil Pack", ["12 pcs"], 60, 120),
            ("Notebook A4", ["Single", "3 Pack"], 80, 220),
            ("Register", ["200 pages", "400 pages"], 180, 350),
            ("Eraser Pack", ["Pack"], 40, 80),
            ("Sharpener", ["Single"], 20, 40),
            ("Glue Stick", ["Single"], 60, 100),
            ("Stapler", ["Single"], 180, 350),
        ],
    ),
    (
        "Insecticides",
        "insecticides",
        "INS",
        [
            ("Mosquito Spray", ["300ml", "600ml"], 280, 520),
            ("Mosquito Coil", ["Pack"], 80, 150),
            ("Mosquito Liquid Refill", ["Pack"], 220, 350),
            ("Cockroach Killer", ["Spray"], 280, 420),
            ("Ant Killer", ["Powder"], 120, 180),
        ],
    ),
    (
        "Health & OTC",
        "health-otc",
        "HLT",
        [
            ("Paracetamol Tablets", ["Pack"], 40, 80),
            ("ORS Sachet", ["Pack of 5"], 60, 100),
            ("Multivitamin", ["Bottle"], 350, 850),
            ("Antiseptic Liquid", ["50ml", "100ml"], 80, 180),
            ("Bandage Roll", ["Single"], 40, 80),
            ("Cotton Pack", ["100g"], 80, 120),
            ("Hand Sanitizer", ["50ml", "100ml", "250ml"], 80, 280),
            ("Thermometer Digital", ["Single"], 450, 850),
        ],
    ),
    (
        "Pet Food",
        "pet-food",
        "PET",
        [
            ("Dog Food Dry", ["500g", "1kg", "3kg"], 450, 2200),
            ("Cat Food Dry", ["500g", "1kg"], 400, 850),
            ("Cat Food Wet", ["Pack"], 120, 200),
            ("Bird Seed Mix", ["500g", "1kg"], 180, 350),
            ("Pet Treats", ["Pack"], 150, 280),
        ],
    ),
    (
        "Baking Needs",
        "baking-needs",
        "BKE",
        [
            ("Baking Powder", ["100g"], 80, 120),
            ("Baking Soda", ["100g"], 50, 80),
            ("Vanilla Essence", ["28ml"], 80, 120),
            ("Cocoa Powder", ["100g", "200g"], 250, 480),
            ("Yeast Instant", ["11g Pack"], 40, 60),
            ("Food Color Pack", ["Pack"], 60, 100),
            ("Cake Mix", ["Box"], 350, 520),
        ],
    ),
    (
        "Condiments & Masala Mix",
        "condiments-masala-mix",
        "MAS",
        [
            ("Biryani Masala", ["50g", "100g"], 80, 160),
            ("Chicken Masala", ["50g", "100g"], 70, 140),
            ("Karahi Masala", ["50g", "100g"], 70, 140),
            ("Chat Masala", ["50g", "100g"], 60, 120),
            ("Tandoori Masala", ["50g"], 80, 110),
            ("Fish Masala", ["50g"], 70, 100),
            ("Nihari Masala", ["50g"], 90, 130),
            ("Haleem Masala", ["50g"], 80, 120),
        ],
    ),
    (
        "Tobacco & Matches",
        "tobacco-matches",
        "TBC",
        [
            ("Cigarette Pack", ["Premium", "Regular"], 350, 650),
            ("Beedi Pack", ["Pack"], 40, 80),
            ("Lighter", ["Single"], 50, 120),
            ("Match Box Large", ["Pack"], 30, 50),
        ],
    ),
]


CATEGORY_BRANDS = {
    "Rice & Grains": ["Guard", "Reem", "Kernel", "Super Kernel", "Falak", "Matco"],
    "Flour & Atta": ["Bake Parlor", "Fine", "Sunny", "Seasons", "Pakistan Atta"],
    "Pulses & Lentils": ["National", "Appendage", "Local Fresh", "Punjab", "Hadi"],
    "Cooking Oil & Ghee": ["Dalda", "Sufi", "Eva", "Canolive", "Habib", "Meezan"],
    "Sugar & Sweeteners": ["Al-Khair", "Shakarganj", "Local", "Splenda"],
    "Salt & Spices": ["National", "Shan", "Pack", "Ahmed", "Mehr"],
    "Tea & Coffee": ["Tapal", "Lipton", "Vital", "Ispahani", "Nescafe", "EveryDay"],
    "Milk & Dairy": ["Olper's", "Nestle", "Haleeb", "Nurpur", "MilkPak", "Dayfresh"],
    "Yogurt & Lassi": ["Nestle", "Olper's", "Nurpur", "Pack"],
    "Cheese & Butter": ["Adam's", "Nurpur", "Olper's", "Happy Cow", "Kraft"],
    "Eggs": ["Farm Fresh", "Organic Farms", "Local"],
    "Bread & Bakery": ["Dawn", "Bread Garden", "Gourmet", "Host"],
    "Biscuits & Cookies": ["LU", "Bisconni", "Peek Freans", "Candyland", "Mayfair"],
    "Snacks & Chips": ["Lays", "Kurkure", "Slanty", "Cheetos", "Uncle Chipps"],
    "Sweets & Chocolates": ["Cadbury", "Nestle", "Candyland", "Now", "Toblerone"],
    "Dry Fruits & Nuts": ["Local Premium", "Kashmir", "Dry Fruit House", "Nutri"],
    "Soft Drinks": ["Coca-Cola", "Pepsi", "7UP", "Sprite", "Fanta", "Pakola"],
    "Juices & Squashes": ["Shezan", "Nestle Fruita", "Slice", "Mitchell's", "Nurpur"],
    "Mineral Water": ["Nestle Pure Life", "Aquafina", "Kinley", "Gourmet", "Murray"],
    "Energy Drinks": ["Red Bull", "Sting", "Booster", "Monster"],
    "Instant Noodles": ["Knorr", "Maggi", "Kolson", "Samyang"],
    "Breakfast Cereals": ["Nestle", "Quaker", "Kellogg's", "Fauji"],
    "Pasta & Macaroni": ["Kolson", "Bake Parlor", "National", "Barilla"],
    "Sauces & Pickles": ["National", "Shangrila", "Mitchell's", "Knorr", "Hellmann's"],
    "Honey & Jam": ["Langnese", "Marhaba", "Mitchell's", "Young's", "Nurpur"],
    "Canned Foods": ["California Garden", "American Garden", "Mitchell's", "Young's"],
    "Frozen Foods": ["K&Ns", "Menu", "PK", "Sabroso", "Wall's"],
    "Fresh Vegetables": ["Fresh Farm", "Local Market", "Green Basket"],
    "Fresh Fruits": ["Fresh Farm", "Local Market", "Orchard"],
    "Personal Care": ["Lux", "Lifebuoy", "Dove", "Safeguard", "Dettol"],
    "Oral Care": ["Colgate", "Pepsodent", "Sensodyne", "Oral-B"],
    "Hair Care": ["Sunsilk", "Head & Shoulders", "Pantene", "Dove", "Vatika"],
    "Skin Care": ["Fair & Lovely", "Nivea", "Pond's", "Garnier", "Vaseline"],
    "Baby Care": ["Pampers", "Huggies", "Johnson's", "Himani", "Sebamed"],
    "Soap & Detergent": ["Surf Excel", "Ariel", "Bonus", "Express", "Lemon Max"],
    "Cleaning Supplies": ["Harpic", "Lizol", "Dettol", "Vim", "Finish"],
    "Tissue & Paper": ["Rose Petal", "Softy", "Tullo", "Max"],
    "Household Items": ["Local", "HomeCare", "Utility"],
    "Plasticware": ["Loyal", "Cutting Edge", "HomeWare"],
    "Batteries & Electrical": ["Toshiba", "Energizer", "Philips", "Osaka", "Sony"],
    "Stationery": ["Dollar", "Piano", "Nafees", "Olympic", "HB"],
    "Insecticides": ["Mortein", "Baygon", "Cobra", "Kingtox"],
    "Health & OTC": ["Panadol", "Disprin", "Eno", "Savlon", "Dettol"],
    "Pet Food": ["Pedigree", "Whiskas", "Meow Mix", "Local"],
    "Baking Needs": ["Bake Parlor", "National", "Foster Clark", "Rafhan"],
    "Condiments & Masala Mix": ["National", "Shan", "Mehr", "Ahmed", "Pack"],
    "Tobacco & Matches": ["Capstan", "Gold Leaf", "Pine", "Ship"],
}

GENERIC_BRANDS = ["National", "Local", "Store Pack", "Premium", "Family"]


def ean13(counter: int) -> str:
    # Use a private-ish prefix so barcodes stay unique in this DB.
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


def build_product_catalog() -> list[tuple[str, str, list[tuple]]]:
    catalog = []
    for name, slug, prefix, templates in CATEGORIES:
        brands = CATEGORY_BRANDS.get(name, GENERIC_BRANDS)
        variants: list[tuple] = []
        for base, sizes, pmin, pmax in templates:
            for size_index, size in enumerate(sizes):
                # Scale price by pack size so larger packs cost more.
                if len(sizes) == 1:
                    lo, hi = pmin, pmax
                else:
                    step = (pmax - pmin) / max(len(sizes) - 1, 1)
                    center = pmin + step * size_index
                    spread = max(step * 0.25, (pmax - pmin) * 0.05)
                    lo = max(pmin, center - spread)
                    hi = min(pmax, center + spread)
                chosen_brands = list(dict.fromkeys([RNG.choice(brands), RNG.choice(brands)]))
                for brand_name in chosen_brands:
                    label = f"{brand_name} {base} {size}"
                    price = round(RNG.uniform(lo, hi), 2)
                    cost = round(price * RNG.uniform(0.65, 0.88), 2)
                    stock = RNG.randint(8, 220)
                    variants.append((label, price, cost, stock))
        catalog.append((name, prefix, variants))
    return catalog


def expand_to_target(catalog: list[tuple[str, str, list[tuple]]]) -> list[tuple]:
    """Flatten and pad/trim to ~PRODUCT_TARGET unique-ish products."""
    flat: list[tuple] = []
    for cat_name, prefix, variants in catalog:
        for idx, (label, price, cost, stock) in enumerate(variants, start=1):
            flat.append((cat_name, prefix, idx, label, price, cost, stock))

    # If short, create numbered extra variants from existing templates.
    next_extra = 1
    while len(flat) < PRODUCT_TARGET:
        cat_name, prefix, variants = catalog[next_extra % len(catalog)]
        base_label, price, cost, stock = RNG.choice(variants)
        extra_label = f"{base_label} Variant {next_extra}"
        flat.append(
            (
                cat_name,
                prefix,
                10_000 + next_extra,
                extra_label,
                round(price * RNG.uniform(0.95, 1.08), 2),
                round(cost * RNG.uniform(0.95, 1.05), 2),
                RNG.randint(5, 250),
            )
        )
        next_extra += 1

    return flat[:PRODUCT_TARGET]


def main() -> int:
    shop = mysql(f"SELECT id FROM shops WHERE id={SHOP_ID}").strip()
    if shop != str(SHOP_ID):
        print(f"Shop {SHOP_ID} not found", file=sys.stderr)
        return 1

    print(f"Clearing existing categories/products for shop_id={SHOP_ID}...")
    # Returns cascade on product delete; sale_items.product_id becomes NULL.
    mysql(f"DELETE FROM products WHERE shop_id={SHOP_ID};")
    mysql(f"DELETE FROM categories WHERE shop_id={SHOP_ID};")

    print(f"Inserting {len(CATEGORIES)} categories...")
    cat_values = []
    for name, slug, _prefix, _templates in CATEGORIES:
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
    print(f"Categories inserted: {len(cat_ids)}")

    catalog = build_product_catalog()
    products = expand_to_target(catalog)
    print(f"Inserting {len(products)} products...")

    # Keep SKU unique per shop and barcode unique globally.
    sku_counters: dict[str, int] = {}
    barcode_counter = 1_000_001
    batch: list[str] = []
    batch_size = 200
    inserted = 0

    for cat_name, prefix, seq, label, price, cost, stock in products:
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
          (SELECT COUNT(*) FROM products WHERE shop_id={SHOP_ID}) AS products,
          (SELECT COUNT(*) FROM products WHERE shop_id={SHOP_ID} AND image IS NULL) AS without_image;
        """
    ).strip()
    print("Done:", summary)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
