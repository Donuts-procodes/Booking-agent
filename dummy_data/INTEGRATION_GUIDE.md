# Booking Agent Integration Guide

## 🎯 Quick Start

This guide shows how to integrate the dummy showroom data with your booking agent system.

---

## 1️⃣ STEP 1: Load Data into Your System

### Option A: Using Excel Data
```python
import pandas as pd

# Load car catalog
df_cars = pd.read_excel('Showroom_Data.xlsx', sheet_name='Car Catalog')
df_company = pd.read_excel('Showroom_Data.xlsx', sheet_name='Company Info')
df_agent = pd.read_excel('Showroom_Data.xlsx', sheet_name='Agent Configuration')
df_bookings = pd.read_excel('Showroom_Data.xlsx', sheet_name='Sample Bookings')

# Convert to database records
for _, row in df_cars.iterrows():
    create_car_record(row)
```

### Option B: Using JSON Data
```python
import json

with open('showroom_booking_data.json') as f:
    data = json.load(f)

# Load company info
company = data['company']
agent_config = data['booking_agent']

# Load all cars
cars = data['cars']

# Load sample bookings
bookings = data['sample_bookings']
```

### Option C: Using CSV Quick Reference
```python
import csv

with open('CAR_QUICK_REFERENCE.csv') as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(f"{row['Brand']} {row['Model']} - ₹{row['Price (INR)']}")
```

---

## 2️⃣ STEP 2: Database Schema Setup

### Car Catalog Table
```sql
CREATE TABLE cars (
    car_id VARCHAR(10) PRIMARY KEY,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    type VARCHAR(20),
    fuel_type VARCHAR(10),
    transmission VARCHAR(10),
    engine_cc INT,
    power_bhp INT,
    price_inr DECIMAL(12, 2),
    color VARCHAR(30),
    availability VARCHAR(20),
    stock_qty INT,
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Bookings/Query Tickets Table
```sql
CREATE TABLE bookings (
    booking_id VARCHAR(10) PRIMARY KEY,
    ticket_number VARCHAR(25) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(15) NOT NULL,
    car_id VARCHAR(10) NOT NULL,
    booking_date DATE NOT NULL,
    preferred_time VARCHAR(20),
    query_type VARCHAR(50),
    message TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(car_id)
);
```

### Company Info Table
```sql
CREATE TABLE company (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(15),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50),
    website VARCHAR(100),
    established INT,
    license_number VARCHAR(50),
    manager_name VARCHAR(100),
    manager_email VARCHAR(100),
    manager_phone VARCHAR(15)
);
```

### Booking Agent Config Table
```sql
CREATE TABLE booking_agent_config (
    agent_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100),
    status VARCHAR(20),
    processing_enabled BOOLEAN,
    auto_response BOOLEAN,
    response_time_minutes INT,
    languages JSON,
    max_daily_bookings INT,
    escalation_level_1 VARCHAR(100),
    escalation_email VARCHAR(100),
    webhook_enabled BOOLEAN,
    webhook_url VARCHAR(255)
);
```

---

## 3️⃣ STEP 3: API Endpoints Setup

### Get All Cars
```
GET /api/cars
Response: {
    "status": "success",
    "total": 22,
    "cars": [...]
}
```

### Get Single Car
```
GET /api/cars/{car_id}
Example: GET /api/cars/CAR-004
Response: {
    "status": "success",
    "data": {...}
}
```

### Search Cars by Brand
```
GET /api/cars?brand={brand}
Example: GET /api/cars?brand=Tata
Response: {
    "status": "success",
    "brand": "Tata",
    "results": 2,
    "cars": [...]
}
```

### Search Cars by Price Range
```
GET /api/cars?min_price={min}&max_price={max}
Example: GET /api/cars?min_price=500000&max_price=1000000
Response: {
    "status": "success",
    "results": 8,
    "cars": [...]
}
```

### Create Booking/Query
```
POST /api/bookings
Request Body: {
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "9876543210",
    "car_id": "CAR-004",
    "booking_date": "2024-01-20",
    "preferred_time": "10:00 AM",
    "query_type": "Test Drive Request",
    "message": "I want to test drive this vehicle"
}
Response: {
    "status": "success",
    "booking_id": "BK-005",
    "ticket_number": "TICKET-2024-01-20-0001",
    "message": "Your booking has been confirmed. We'll contact you within 5 minutes."
}
```

### Get Booking Status
```
GET /api/bookings/{ticket_number}
Example: GET /api/bookings/TICKET-2024-01-15-0001
Response: {
    "status": "success",
    "data": {
        "booking_id": "BK-001",
        "ticket_number": "TICKET-2024-01-15-0001",
        "customer_name": "Amit Sharma",
        "car_id": "CAR-004",
        "query_type": "Specification Query",
        "status": "Resolved"
    }
}
```

---

## 4️⃣ STEP 4: Booking Agent Configuration

### Initialize Agent
```python
from booking_agent import BookingAgent

agent = BookingAgent(
    agent_id="AGENT-AUTO-001",
    name="AutoBooking Pro AI Agent",
    response_time_minutes=5,
    languages=["English", "Hindi"],
    max_daily_bookings=50
)

# Load database
agent.load_cars_from_json('showroom_booking_data.json')
agent.load_company_info('showroom_booking_data.json')

# Enable features
agent.enable_auto_response(True)
agent.enable_webhook('https://api.premiumautoshowcase.com/bookings')
```

### Process Customer Query
```python
customer_query = "I'm interested in a diesel SUV with automatic transmission"

response = agent.process_query(
    query=customer_query,
    customer_name="Priya Patel",
    customer_email="priya@example.com",
    customer_phone="9876543211"
)

print(response)
# Output: Found 3 vehicles matching your criteria:
# - Tata Nexon Diesel Automatic
# - Kia Seltos Diesel Automatic
# - Hyundai Creta Diesel Automatic
```

---

## 5️⃣ STEP 5: Webhook Integration

### Webhook Payload Format
```json
{
    "event": "booking_created",
    "timestamp": "2024-01-20T10:00:00Z",
    "data": {
        "booking_id": "BK-005",
        "ticket_number": "TICKET-2024-01-20-0001",
        "customer": {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "9876543210"
        },
        "car": {
            "car_id": "CAR-004",
            "brand": "Tata",
            "model": "Nexon",
            "price": 750000
        },
        "query_type": "Test Drive Request",
        "message": "I want to test drive this vehicle",
        "preferred_time": "10:00 AM",
        "status": "Confirmed"
    }
}
```

### Webhook Handler Example
```python
@app.route('/api/bookings/webhook', methods=['POST'])
def handle_booking_webhook():
    payload = request.json
    
    if payload['event'] == 'booking_created':
        # Send confirmation email
        send_email(
            to=payload['data']['customer']['email'],
            subject=f"Booking Confirmed - {payload['data']['ticket_number']}",
            body=f"Your booking for {payload['data']['car']['brand']} {payload['data']['car']['model']} is confirmed!"
        )
        
        # Send to manager
        send_email(
            to="rajesh@premiumautoshowcase.com",
            subject=f"New Query Ticket: {payload['data']['ticket_number']}",
            body=f"New customer query from {payload['data']['customer']['name']}"
        )
        
    return {"status": "received"}, 200
```

---

## 6️⃣ STEP 6: Frontend Integration

### Display Car Catalog
```html
<!-- HTML Template -->
<div class="cars-grid">
    {% for car in cars %}
    <div class="car-card">
        <img src="car_images/{{ car.car_id }}.png" alt="{{ car.brand }} {{ car.model }}">
        <h3>{{ car.brand }} {{ car.model }}</h3>
        <p>{{ car.description }}</p>
        <div class="specs">
            <span>{{ car.fuel_type }}</span>
            <span>{{ car.transmission }}</span>
            <span>{{ car.power_bhp }} BHP</span>
        </div>
        <div class="price">₹{{ car.price_inr | format_currency }}</div>
        <button onclick="openBookingForm('{{ car.car_id }}')">Book Now</button>
    </div>
    {% endfor %}
</div>
```

### Booking Form Component
```javascript
function openBookingForm(carId) {
    const form = document.getElementById('bookingForm');
    form.elements['car_id'].value = carId;
    form.style.display = 'block';
}

document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            customer_name: formData.get('name'),
            customer_email: formData.get('email'),
            customer_phone: formData.get('phone'),
            car_id: formData.get('car_id'),
            query_type: formData.get('query_type'),
            message: formData.get('message'),
            preferred_date: formData.get('date'),
            preferred_time: formData.get('time')
        })
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
        alert(`Booking Confirmed!\nTicket: ${result.ticket_number}`);
    }
});
```

---

## 7️⃣ STEP 7: Testing Guide

### Test Car Search
```bash
# Get all cars
curl http://localhost:5000/api/cars

# Search by brand
curl "http://localhost:5000/api/cars?brand=Tata"

# Search by price
curl "http://localhost:5000/api/cars?min_price=500000&max_price=1000000"
```

### Test Booking Creation
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test User",
    "customer_email": "test@example.com",
    "customer_phone": "9876543210",
    "car_id": "CAR-004",
    "query_type": "Test Drive Request",
    "message": "I want to test drive this vehicle",
    "preferred_date": "2024-01-20",
    "preferred_time": "10:00 AM"
  }'
```

### Test Sample Bookings
Use the 4 sample bookings (BK-001 to BK-004) from `showroom_booking_data.json` to verify your system can handle existing data.

---

## 8️⃣ STEP 8: Image File Management

### File Structure
```
/static/
  └── car_images/
      ├── CAR_001_001.png
      ├── CAR_002_002.png
      ├── CAR_003_003.png
      └── ... (22 total)
```

### Image Serving
```python
# Flask example
from flask import send_from_directory

@app.route('/car_images/<filename>')
def serve_car_image(filename):
    return send_from_directory('static/car_images', filename)
```

### Fallback Image
```python
def get_car_image_url(car_id):
    image_path = f'car_images/{car_id}.png'
    if os.path.exists(f'static/{image_path}'):
        return f'/static/{image_path}'
    else:
        return '/static/default-car.png'  # Fallback
```

---

## 9️⃣ STEP 9: Email Notifications

### Booking Confirmation Email Template
```html
<html>
  <body>
    <h1>Booking Confirmation</h1>
    <p>Dear {{ customer_name }},</p>
    <p>Thank you for your interest in <strong>{{ car.brand }} {{ car.model }}</strong>.</p>
    
    <h3>Your Query Details:</h3>
    <ul>
      <li>Ticket Number: <strong>{{ ticket_number }}</strong></li>
      <li>Query Type: {{ query_type }}</li>
      <li>Preferred Time: {{ preferred_time }}</li>
    </ul>
    
    <p>Our booking agent will contact you within 5 minutes.</p>
    
    <h3>Vehicle Information:</h3>
    <p>
      <strong>{{ car.brand }} {{ car.model }}</strong><br>
      Price: ₹{{ car.price_inr }}<br>
      Fuel: {{ car.fuel_type }}<br>
      Transmission: {{ car.transmission }}
    </p>
    
    <p>Best regards,<br>
    Premium Auto Showcase Team</p>
  </body>
</html>
```

---

## 🔟 STEP 10: Monitoring & Analytics

### Track Booking Metrics
```python
def get_booking_analytics():
    return {
        "total_bookings": count_bookings(),
        "bookings_today": count_bookings(date.today()),
        "resolved_bookings": count_bookings(status="Resolved"),
        "pending_bookings": count_bookings(status="Pending"),
        "most_viewed_car": get_top_car(),
        "average_response_time": "5 minutes"
    }
```

### Log Query Processing
```python
import logging

logging.basicConfig(
    filename='booking_agent.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logging.info(f"Query processed for car: {car_id}")
logging.info(f"Booking created: {ticket_number}")
```

---

## ✅ Verification Checklist

- [ ] All 22 cars loaded into database
- [ ] Company information stored correctly
- [ ] Booking agent configured
- [ ] API endpoints responding correctly
- [ ] Webhook integration working
- [ ] Car images accessible
- [ ] Email notifications sending
- [ ] Sample bookings displaying
- [ ] Ticket number format correct
- [ ] Status tracking functional

---

## 🆘 Troubleshooting

### Issue: Car images not loading
**Solution:** Check image file path in database matches `/car_images/` directory

### Issue: Booking email not sending
**Solution:** Verify SMTP configuration and check email template

### Issue: Webhook not receiving
**Solution:** Check webhook URL in agent config and firewall rules

### Issue: Database connection error
**Solution:** Verify connection string and credentials

---

## 📞 Support

For issues or questions:
- **Email:** booking@premiumautoshowcase.com
- **Phone:** +91-9876-543-210
- **Manager:** Rajesh Kumar Singh (rajesh@premiumautoshowcase.com)

---

**Version:** 1.0  
**Last Updated:** January 2024  
**Compatible Systems:** Python 3.8+, Node.js 14+, PHP 7.4+
