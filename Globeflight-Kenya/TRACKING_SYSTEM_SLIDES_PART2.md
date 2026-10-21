# Globeflight Kenya Tracking System
## Management Presentation - Part 2

---

# Slide 11: Database Structure

## 💾 Data Organization

### **5 Main Tables:**

#### **1. Shipments** (Core Data)
- Tracking number, sender, receiver
- Package details, weight, dimensions
- Origin, destination, status
- Created by, timestamps

#### **2. Tracking Updates** (History)
- Shipment ID (link to shipment)
- Status, location, description
- GPS coordinates (latitude/longitude)
- Updated by, timestamp

#### **3. Users** (Access Control)
- Email, password (encrypted)
- Full name, role
- Active status, avatar
- Last login, timestamps

#### **4. Proof of Delivery** (Evidence)
- Shipment ID
- Recipient name, photo
- Delivery location, GPS
- Notes, timestamp

#### **5. Shipment Exceptions** (Issues)
- Shipment ID
- Exception type, severity
- Description, location
- Status, resolution notes

### **Relationships:**
- One shipment → Many tracking updates
- One shipment → Many PODs
- One shipment → Many exceptions
- One user → Many shipments created
- One user → Many updates added

---

# Slide 12: Security Features

## 🔐 How We Keep Data Safe

### **1. Authentication**
- ✅ JWT (JSON Web Tokens)
- ✅ 7-day token expiry
- ✅ Secure password hashing (bcrypt)
- ✅ Email verification

### **2. Authorization**
- ✅ Role-based access control
- ✅ Permission checks on every request
- ✅ Superadmin, Admin, User roles
- ✅ Public endpoints (no auth needed)

### **3. Data Protection**
- ✅ HTTPS encryption (SSL)
- ✅ Password hashing (never stored plain text)
- ✅ SQL injection prevention
- ✅ Input validation & sanitization

### **4. Privacy**
- ✅ Public tracking hides sensitive data
- ✅ Email addresses not shown publicly
- ✅ Phone numbers not shown publicly
- ✅ Only tracking info visible

### **5. Audit Trail**
- ✅ Every action logged
- ✅ User ID recorded for all changes
- ✅ Timestamps on all records
- ✅ Cannot delete tracking history

---

# Slide 13: Real-Time Updates

## ⚡ Live Tracking with WebSocket

### **How It Works:**

1. **Customer Opens Tracking Page**
   - Browser connects to WebSocket server
   - Subscribes to tracking number updates

2. **Admin Adds Update**
   - Update saved to database
   - Email sent to sender & receiver
   - WebSocket broadcasts update

3. **Customer Sees Update Instantly**
   - No page refresh needed
   - Update appears in real-time
   - Map updates automatically

### **Benefits:**
- ✅ **Instant updates** - No delay
- ✅ **No refresh needed** - Automatic
- ✅ **Better UX** - Modern experience
- ✅ **Reduced server load** - Efficient

### **Technical:**
- **Technology:** Socket.IO
- **Namespaces:** 
  - `/admin/api` (authenticated)
  - `/public/tracking` (public)
- **Events:** 
  - `tracking-update`
  - `shipment-update`

---

# Slide 14: Email Notifications

## 📧 Automated Communication

### **3 Types of Emails:**

#### **1. Shipment Created**
**Sent to:** Sender & Receiver  
**When:** Shipment is created  
**Contains:**
- Tracking number
- Origin & destination
- Package description
- Estimated delivery
- Tracking link

#### **2. Status Updated**
**Sent to:** Sender & Receiver  
**When:** Admin adds tracking update  
**Contains:**
- New status
- Location
- Description
- Timestamp
- Tracking link

#### **3. Delivered**
**Sent to:** Sender & Receiver  
**When:** Status changed to "Delivered"  
**Contains:**
- Delivery confirmation
- Recipient name
- Delivery location
- POD photo (if available)
- Tracking link

### **Email Features:**
- ✅ Professional HTML templates
- ✅ Globeflight branding
- ✅ Mobile-responsive
- ✅ Clickable tracking links
- ✅ SMTP delivery (reliable)

---


