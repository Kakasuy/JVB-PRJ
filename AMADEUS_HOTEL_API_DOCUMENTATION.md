# Amadeus Hotel API - Thông tin chi tiết về dữ liệu Hotels

## Tổng quan
Amadeus API cung cấp thông tin hotel qua **2 bước (2-step process)**:
1. **Hotel List API**: Tìm hotels theo location
2. **Hotel Offers API**: Lấy pricing và availability

---

## 🏨 **BƯỚC 1: Hotel List API**
**Endpoint**: `/v1/reference-data/locations/hotels/by-city`

### Thông tin cung cấp cho mỗi hotel:

#### **🏢 Thông tin cơ bản**
```json
{
  "hotelId": "ALNYC647",              // ID duy nhất của hotel
  "name": "Aloft Manhattan Downtown Financial District", 
  "chainCode": "AL",                  // Mã chuỗi khách sạn (AL = Aloft)
  "masterChainCode": "EM",            // Mã chuỗi chính (EM = Marriott)
  "dupeId": 501447323,                // ID trùng lặp
  "iataCode": "NYC"                   // Mã IATA của thành phố
}
```

#### **📍 Thông tin địa lý**
```json
{
  "geoCode": {
    "latitude": 40.71041,             // Tọa độ chính xác
    "longitude": -74.00666
  },
  "distance": {
    "value": 0.37,                    // Khoảng cách từ city center
    "unit": "KM"
  }
}
```

#### **🏠 Địa chỉ đầy đủ**
```json
{
  "address": {
    "countryCode": "US",              // Mã quốc gia
    "stateCode": "NY",                // Mã bang/tỉnh
    "cityName": "NEW YORK",           // Tên thành phố
    "postalCode": "10038",            // Mã bưu điện
    "lines": ["49 53 ANN STREET"]     // Địa chỉ chi tiết
  }
}
```

#### **⏰ Metadata**
```json
{
  "lastUpdate": "2025-07-28T06:02:45" // Thời gian cập nhật cuối
}
```

---

## 💰 **BƯỚC 2: Hotel Offers API**
**Endpoint**: `/v3/shopping/hotel-offers`

### Thông tin cung cấp cho mỗi offer:

#### **🏨 Hotel Information (Enhanced)**
```json
{
  "hotel": {
    "type": "hotel",
    "hotelId": "ALNYC647",
    "chainCode": "AL", 
    "dupeId": "501447323",
    "name": "Aloft Manhattan Downtown Financial District",
    "cityCode": "NYC",
    "latitude": 40.71041,             // Tọa độ trực tiếp
    "longitude": -74.00666
  }
}
```

#### **💵 Pricing Details (Chi tiết giá)**
```json
{
  "price": {
    "currency": "USD",                // Đơn vị tiền tệ
    "base": "494.16",                 // Giá gốc (chưa thuế)
    "total": "574.06",                // Tổng tiền (bao gồm thuế, phí)
    "variations": {
      "average": {
        "base": "247.08"              // Giá trung bình mỗi đêm
      },
      "changes": [                    // Giá theo từng ngày
        {
          "startDate": "2025-08-15",
          "endDate": "2025-08-16", 
          "base": "234.03"            // Giá đêm 1
        },
        {
          "startDate": "2025-08-16",
          "endDate": "2025-08-17",
          "base": "260.13"            // Giá đêm 2
        }
      ]
    }
  }
}
```

#### **🛏️ Room Information (Thông tin phòng)**
```json
{
  "room": {
    "type": "AP7",                    // Mã loại phòng
    "typeEstimated": {
      "beds": 1,                      // Số giường
      "bedType": "KING"               // Loại giường
    },
    "description": {
      "text": "Prepay Non-refundable Non-changeable...\nSleeps 2, Fast & free WiFi...\n1 King, 210sqft/19sqm-230sqft/21sqm,",
      "lang": "EN"                    // Mô tả chi tiết phòng
    }
  }
}
```

#### **👥 Guest Information**
```json
{
  "guests": {
    "adults": 2                       // Số người lớn
  }
}
```

#### **📋 Booking Policies (Chính sách đặt phòng)**
```json
{
  "policies": {
    "cancellations": [
      {
        "description": {
          "text": "NON-REFUNDABLE RATE"  // Chính sách hủy
        },
        "policyType": "CANCELLATION"
      }
    ],
    "paymentType": "deposit",         // Loại thanh toán
    "refundable": {
      "cancellationRefund": "NON_REFUNDABLE"  // Có hoàn tiền không
    }
  }
}
```

#### **📅 Booking Details**
```json
{
  "id": "YCP3YPPTNP",                 // ID của offer
  "checkInDate": "2025-08-15",        // Ngày check-in
  "checkOutDate": "2025-08-17",       // Ngày check-out
  "rateCode": "RAC",                  // Mã rate
  "available": true                   // Còn phòng không
}
```

---

## 📊 **Thống kê từ API thực tế**
Từ test với NYC:
- **418 hotels** được tìm thấy trong bán kính 20km
- **Chỉ ~5-10% hotels** có offers available (pricing)
- **Rate limiting**: ~10-15 requests/minute cho test API

---

## 🔍 **So sánh với implementation hiện tại**

### ✅ **Đang sử dụng:**
- `hotelId`, `name` → **ID và tên hotel**
- `geoCode` → **Tọa độ bản đồ**
- `address.lines` → **Địa chỉ hiển thị**
- `price.total` → **Giá phòng**
- `guests.adults` → **Số khách**

### ❌ **Chưa sử dụng (có thể mở rộng):**
- `chainCode` → **Thương hiệu hotel chain**
- `distance` → **Khoảng cách từ trung tâm**
- `room.description` → **Mô tả chi tiết phòng**
- `room.typeEstimated` → **Thông tin giường/phòng chính xác**
- `policies` → **Chính sách hủy/thanh toán**
- `price.variations` → **Giá theo từng ngày**
- `lastUpdate` → **Độ fresh của data**

### 🚀 **Cơ hội mở rộng:**
1. **Hotel Chain Logos**: Sử dụng `chainCode` để hiển thị logo
2. **Distance Filter**: Lọc theo khoảng cách `distance.value`
3. **Room Details**: Hiển thị `beds`, `bedType`, square footage
4. **Cancellation Policy**: Hiển thị chính sách hủy
5. **Daily Pricing**: Chart giá theo ngày từ `price.variations`
6. **Amenities**: Từ `room.description` parsing

---

## 🎯 **Kết luận**
Amadeus Hotel API cung cấp **rất nhiều thông tin chi tiết** về hotels, hiện tại chỉ sử dụng ~30% potential. Có thể mở rộng đáng kể để tạo trải nghiệm booking phong phú hơn.