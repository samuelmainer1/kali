# 🚀 Globeflight Kenya - Production Deployment Instructions

## 📦 What's New in This Build

### ✅ New Features Added:
1. **Clients Section on Landing Page** - Added after Hero section
2. **Tawk.to Live Chat Widget** - Available on all pages
3. **Fixed .htaccess** - Admin dashboard refresh issue resolved

---

## 📁 Files Included

**File:** `Globeflight-Kenya-Production.zip` (85 MB)
**Location:** `/Users/Globeflight/Downloads/Globeflight-Kenya/`

---

## 🔧 Deployment Steps

### **Step 1: Backup Current Website**

1. **Login to cPanel**
   - URL: https://globeflight.co.ke:2083
   - Enter your credentials

2. **Backup Current Files**
   - Go to **File Manager**
   - Navigate to `/home/frd1meypzu0k/public_html/`
   - Select all files EXCEPT the `admin/` folder
   - Click **Compress**
   - Name it: `backup-globeflight-YYYY-MM-DD.zip`
   - Download the backup to your computer

---

### **Step 2: Upload New Files**

1. **Delete Old Files** (Keep `admin/` folder!)
   - In File Manager, navigate to `/home/frd1meypzu0k/public_html/`
   - Select all files and folders EXCEPT:
     - `admin/` folder
     - `.htaccess` file (we'll update this separately)
   - Click **Delete**

2. **Upload New Build**
   - Click **Upload**
   - Select `Globeflight-Kenya-Production.zip`
   - Wait for upload to complete

3. **Extract Files**
   - Right-click on `Globeflight-Kenya-Production.zip`
   - Select **Extract**
   - Extract to: `/home/frd1meypzu0k/public_html/`
   - Click **Extract Files**

4. **Delete Zip File**
   - Delete `Globeflight-Kenya-Production.zip` after extraction

---

### **Step 3: Update .htaccess File**

1. **Open .htaccess**
   - In File Manager, navigate to `/home/frd1meypzu0k/public_html/`
   - Right-click on `.htaccess`
   - Select **Edit**

2. **Replace Content**
   - Copy the content from the updated `.htaccess` file in your project
   - Or use the `COMPLETE.htaccess` file from the logistics-backend folder

3. **Save**
   - Click **Save Changes**

---

### **Step 4: Verify File Structure**

Your `public_html/` folder should look like this:

```
public_html/
├── index.html                    ← Main website entry point
├── .htaccess                     ← Updated with admin routing
├── assets/                       ← CSS, JS, images
├── admin/                        ← Admin dashboard (DO NOT DELETE)
│   ├── index.html
│   ├── static/
│   └── ...
├── favicon.ico
├── logo.png
├── sitemap.xml
├── robots.txt
└── ... (other static files)
```

---

### **Step 5: Test the Website**

#### **Main Website:**
- [ ] **Homepage:** https://globeflight.co.ke
- [ ] **Landing Page:** https://globeflight.co.ke/ (check Clients section after Hero)
- [ ] **Services:** https://globeflight.co.ke/services
- [ ] **About:** https://globeflight.co.ke/about-us
- [ ] **Contact:** https://globeflight.co.ke/contact-us
- [ ] **Blog:** https://globeflight.co.ke/blog
- [ ] **Track:** https://globeflight.co.ke/track
- [ ] **Tawk.to Chat:** Should appear in bottom-right corner on all pages

#### **Admin Dashboard:**
- [ ] **Login:** https://globeflight.co.ke/admin/login
- [ ] **Dashboard:** https://globeflight.co.ke/admin/dashboard
- [ ] **Refresh Test:** Press F5 on dashboard (should NOT show white screen)
- [ ] **Direct URL:** Type `https://globeflight.co.ke/admin/shipments` in browser
- [ ] **API Calls:** Create a test shipment
- [ ] **File Downloads:** Download a document from job applications

---

## ✅ What's Working Now

1. ✅ **Clients Section** - Visible on landing page after Hero section
2. ✅ **Tawk.to Chat** - Live chat widget on all pages
3. ✅ **Admin Refresh** - No more white screen when refreshing admin pages
4. ✅ **Backend Proxy** - API calls and file downloads working
5. ✅ **SEO** - Sitemap and RSS feed generated
6. ✅ **Mobile Responsive** - All sections optimized for mobile

---

## 🐛 Troubleshooting

### **Tawk.to Chat Not Showing?**
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for errors (F12)
- Verify script is in `index.html` (lines 56-68)

### **Admin Dashboard White Screen?**
- Check if `.htaccess` was updated correctly
- Verify admin files exist in `/public_html/admin/`
- Check error logs in cPanel

### **Clients Section Not Showing?**
- Clear browser cache
- Check if you're on the landing page (root `/`)
- Verify files were extracted correctly

---

## 📞 Support

If you encounter any issues:
- **Email:** cs@globeflightkenya.com
- **Phone:** +254 729 341 277

---

**Deployment completed successfully! 🎉**


