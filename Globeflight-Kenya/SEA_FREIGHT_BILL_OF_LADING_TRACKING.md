# 🚢 Sea Freight & Bill of Lading Tracking - Globeflight Kenya

## ✅ YES! Your Tracking System Fully Supports Sea Shipments & Bill of Lading

---

## 📋 What is Bill of Lading (B/L)?

A **Bill of Lading** is a legal document issued by a carrier (shipping line) to a shipper that details:
- Type, quantity, and destination of goods being carried
- Serves as a shipment receipt when the carrier delivers the goods
- Acts as a contract between the shipper and carrier
- Can be used as a document of title to the goods

**Common B/L Numbers:**
- Format: `MAEU123456789` (Maersk)
- Format: `MSCU987654321` (MSC)
- Format: `CMDU456789123` (CMA CGM)
- Format: `HLCU789456123` (Hapag-Lloyd)

---

## ✅ How Your System Handles Sea Freight & B/L

### **1. Third-Party Tracking Number Field**

Your system has a dedicated field for Bill of Lading numbers:

```javascript
thirdPartyTrackingNumber: {
  type: DataTypes.STRING(100),
  allowNull: true,
  field: 'third_party_tracking_number'
}
```

**What this means:**
- ✅ You can store the shipping line's B/L number (e.g., `MAEU123456789`)
- ✅ Your internal tracking number (e.g., `GF123456789`) remains unique
- ✅ Customers can reference both numbers
- ✅ Easy cross-referencing with shipping line tracking

---

### **2. Mode Field for Transport Type**

```javascript
mode: {
  type: DataTypes.STRING(50),
  allowNull: true
}
```

**Supported modes:**
- ✅ `Sea Freight` / `Ocean Freight`
- ✅ `Air Freight`
- ✅ `Road Transport`
- ✅ `Rail Freight`
- ✅ `Multimodal` (combination)

---

### **3. Service Type Field**

```javascript
serviceType: {
  type: DataTypes.STRING(100),
  field: 'service_type'
}
```

**Sea freight service types:**
- ✅ FCL (Full Container Load)
- ✅ LCL (Less than Container Load)
- ✅ Break Bulk
- ✅ RoRo (Roll-on/Roll-off)
- ✅ Express Sea Freight

---

## 🎯 Real-World Sea Freight Tracking Example

### **Scenario: Importing Electronics from China to Kenya**

#### **Step 1: Create Shipment in Admin Dashboard**

**Shipment Details:**
- **Your Tracking Number:** `GF234567890` (auto-generated)
- **B/L Number:** `MAEU987654321` (from Maersk)
- **Mode:** Sea Freight
- **Service Type:** FCL - 20ft Container
- **Origin:** Shanghai Port, China
- **Destination:** Mombasa Port, Kenya
- **Package Description:** Electronics - 500 units smartphones
- **Weight:** 2,500 kg
- **CBM:** 15.5 m³
- **Number of Packages:** 25 cartons
- **Declared Value:** $50,000 USD

#### **Step 2: Add Tracking Updates**

**Update 1:**
- **Status:** Container Loaded
- **Location:** Shanghai Port, China
- **Description:** Container MAEU987654321 loaded on vessel "MSC MAYA"
- **Date:** 2024-12-01 10:00 AM

**Update 2:**
- **Status:** Vessel Departed
- **Location:** Shanghai Port, China
- **Description:** Vessel departed Shanghai. ETA Mombasa: 2024-12-15
- **Date:** 2024-12-01 6:00 PM

**Update 3:**
- **Status:** In Transit
- **Location:** Singapore Port
- **Description:** Vessel transshipment at Singapore
- **Date:** 2024-12-05 2:00 PM

**Update 4:**
- **Status:** Vessel Arrived
- **Location:** Mombasa Port, Kenya
- **Description:** Vessel arrived at Mombasa Port
- **Date:** 2024-12-15 8:00 AM

**Update 5:**
- **Status:** Customs Clearance
- **Location:** Mombasa Port, Kenya
- **Description:** Container offloaded. Customs clearance in progress
- **Date:** 2024-12-16 10:00 AM

**Update 6:**
- **Status:** Cleared Customs
- **Location:** Mombasa Port, Kenya
- **Description:** Customs cleared. Ready for delivery
- **Date:** 2024-12-18 3:00 PM

**Update 7:**
- **Status:** Out for Delivery
- **Location:** Nairobi, Kenya
- **Description:** Container dispatched to Nairobi warehouse
- **Date:** 2024-12-19 7:00 AM

**Update 8:**
- **Status:** Delivered
- **Location:** Nairobi Industrial Area, Kenya
- **Description:** Container delivered and offloaded at customer warehouse
- **Date:** 2024-12-20 2:00 PM
- **POD:** Photo of recipient, GPS coordinates, signature

---

## 📊 What Customers See When Tracking

### **Public Tracking Page** (https://globeflight.co.ke/track)

**Customer enters:** `GF234567890` OR `MAEU987654321`

**They see:**

1. **Shipment Overview:**
   - Tracking Number: GF234567890
   - B/L Number: MAEU987654321
   - Current Status: Delivered
   - Origin: Shanghai Port, China
   - Destination: Mombasa Port, Kenya
   - Service: FCL - 20ft Container
   - Mode: Sea Freight

2. **Complete Tracking Timeline:**
   - All 8 updates with dates, locations, descriptions
   - GPS coordinates for each location
   - Interactive map showing route

3. **Shipment Details:**
   - Package Description: Electronics - 500 units smartphones
   - Weight: 2,500 kg
   - Volume: 15.5 m³
   - Number of Packages: 25 cartons

4. **Actions:**
   - Download Waybill (PDF)
   - Print Tracking Info
   - Share Tracking Link

---

## 🎯 Key Features for Sea Freight

### **1. Long Transit Time Support**
- ✅ Sea freight takes 15-45 days
- ✅ System handles unlimited tracking updates
- ✅ Timeline shows complete journey
- ✅ Customers can track at any time

### **2. Multiple Locations**
- ✅ Port of Loading (POL)
- ✅ Transshipment Ports
- ✅ Port of Discharge (POD)
- ✅ Final Delivery Location
- ✅ GPS coordinates for each

### **3. Container Information**
- ✅ Store container number in description
- ✅ Track multiple containers per shipment
- ✅ FCL vs LCL differentiation
- ✅ Container size (20ft, 40ft, 40ft HC)

### **4. Customs Clearance Tracking**
- ✅ Dedicated status for customs
- ✅ Track clearance progress
- ✅ Exception management for delays
- ✅ Document requirements tracking

### **5. Exception Management**
- ✅ Port congestion delays
- ✅ Weather delays
- ✅ Customs hold
- ✅ Documentation issues
- ✅ Vessel schedule changes

---

## 📝 How to Create Sea Freight Shipment

### **In Admin Dashboard:**

1. **Click "Create Shipment"**

2. **Enter Sender Details:**
   - Company Name: Shanghai Electronics Ltd
   - Contact Person: Li Wei
   - Email: liwei@shanghai-electronics.com
   - Phone: +86 21 1234 5678
   - Address: 123 Pudong Road, Shanghai, China

3. **Enter Receiver Details:**
   - Company Name: Nairobi Electronics Distributors
   - Contact Person: John Kamau
   - Email: john@nairobi-electronics.co.ke
   - Phone: +254 722 123 456
   - Address: Industrial Area, Nairobi, Kenya

4. **Enter Shipment Details:**
   - **Third-Party Tracking Number:** MAEU987654321 (B/L Number)
   - **Mode:** Sea Freight
   - **Service Type:** FCL - 20ft Container
   - **Package Description:** Electronics - 500 units smartphones
   - **Weight:** 2500 kg
   - **Dimensions:** 589 x 235 x 239 cm (20ft container)
   - **CBM:** 15.5 m³
   - **Number of Packages:** 25 cartons
   - **Declared Value:** 50000 USD
   - **Origin:** Shanghai Port, China
   - **Destination:** Mombasa Port, Kenya

5. **Click "Create Shipment"**

**System automatically:**
- ✅ Generates tracking number: GF234567890
- ✅ Stores B/L number: MAEU987654321
- ✅ Sends email to sender with both numbers
- ✅ Sends email to receiver with both numbers
- ✅ Creates initial tracking update
- ✅ Geocodes Shanghai Port location

---

## 📧 Email Notifications

### **Sender Receives:**
```
Subject: Shipment Created - GF234567890

Dear Shanghai Electronics Ltd,

Your sea freight shipment has been created successfully.

Globeflight Tracking Number: GF234567890
Bill of Lading Number: MAEU987654321
Service: FCL - 20ft Container
Origin: Shanghai Port, China
Destination: Mombasa Port, Kenya

Track your shipment: https://globeflight.co.ke/track?number=GF234567890

Best regards,
Globeflight Kenya
```

### **Receiver Receives:**
```
Subject: Incoming Shipment - GF234567890

Dear Nairobi Electronics Distributors,

A sea freight shipment is on its way to you.

Globeflight Tracking Number: GF234567890
Bill of Lading Number: MAEU987654321
Service: FCL - 20ft Container
From: Shanghai Port, China
To: Mombasa Port, Kenya

Track your shipment: https://globeflight.co.ke/track?number=GF234567890

Best regards,
Globeflight Kenya
```

---

## 🔄 Tracking Updates for Sea Freight

### **Common Sea Freight Statuses:**

1. **Booking Confirmed** - Shipping line booking confirmed
2. **Container Loaded** - Cargo loaded into container
3. **Gate In** - Container received at port
4. **Vessel Loaded** - Container loaded on vessel
5. **Vessel Departed** - Vessel left port of loading
6. **In Transit** - Vessel sailing to destination
7. **Transshipment** - Container transferred to another vessel
8. **Vessel Arrived** - Vessel arrived at destination port
9. **Container Discharged** - Container offloaded from vessel
10. **Customs Clearance** - Undergoing customs inspection
11. **Cleared Customs** - Customs clearance completed
12. **Gate Out** - Container released from port
13. **Out for Delivery** - Container dispatched for delivery
14. **Delivered** - Container delivered to final destination

---

## 💡 Additional Features

### **1. Document Management**
- Upload B/L copy
- Upload packing list
- Upload commercial invoice
- Upload customs documents
- All accessible via tracking page

### **2. Multiple Containers**
- Create separate shipment for each container
- Link related shipments
- Track entire consignment

### **3. Vessel Information**
- Add vessel name in description
- Add voyage number
- Add ETA (Estimated Time of Arrival)

### **4. Port-to-Door Service**
- Track from origin port to final delivery
- Include inland transport
- Complete door-to-door visibility

---

## ✅ Summary: Your System is Fully Capable!

**YES, your tracking system can handle:**
- ✅ Sea freight shipments
- ✅ Bill of Lading numbers
- ✅ FCL and LCL shipments
- ✅ Container tracking
- ✅ Port-to-port tracking
- ✅ Customs clearance tracking
- ✅ Long transit times (weeks/months)
- ✅ Multiple transshipment points
- ✅ Complete documentation
- ✅ Real-time updates
- ✅ Customer notifications

**The system is already built to handle ALL shipping modes:**
- 🚢 Sea Freight (FCL, LCL, Break Bulk)
- ✈️ Air Freight (Express, Standard)
- 🚛 Road Transport (Truck, Van)
- 🚂 Rail Freight
- 🌍 Multimodal (combination of above)

---

## 📞 Tell Your Customers:

**"Yes, we can track your sea freight shipments with Bill of Lading numbers. Our system provides complete visibility from port of loading to final delivery, including customs clearance and inland transport. You'll receive real-time updates via email and can track online 24/7 using either our tracking number or your B/L number."**

---

**Your tracking system is enterprise-grade and handles all types of shipments! 🎉**

