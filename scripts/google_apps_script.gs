const SPREADSHEET_ID = ''; // MASUKKAN ID SPREADSHEET ANDA DI SINI

function getDatabase() {
  return SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

// ==========================================
// HANDLE GET REQUESTS
// ==========================================
function doGet(e) {
  const action = e.parameter.action;
  try {
    switch (action) {
      case 'getProducts': return responseJson(handleGetProducts());
      case 'searchProduct': return responseJson(handleSearchProduct(e.parameter.label));
      case 'getStoreSettings': return responseJson(handleGetStoreSettings());
      case 'getAnalytics': return responseJson(handleGetAnalytics(e.parameter.filter));
      default: return responseJson({ success: true, message: "AutoCashier GAS Backend is Running!" });
    }
  } catch (error) {
    return responseError(error.toString(), 500);
  }
}

// ==========================================
// HANDLE POST REQUESTS
// ==========================================
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return responseError("Invalid JSON body", 400);
  }
  const action = body.action || e.parameter.action;
  try {
    switch (action) {
      case 'login': return responseJson(handleLogin(body));
      case 'register': return responseJson(handleRegister(body));
      case 'forgotPassword': return responseJson(handleForgotPassword(body));
      case 'resetPassword': return responseJson(handleResetPassword(body));
      case 'checkout': return responseJson(handleCheckout(body));
      case 'updateUser': return responseJson(handleUpdateUser(body));
      default: return responseError('Invalid POST action: ' + action, 400);
    }
  } catch (error) {
    return responseError(error.toString(), 500);
  }
}

// ==========================================
// UTILITIES
// ==========================================
function responseJson(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
}

function responseError(message, code) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, message: message }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*");
}

function getSheetDataAsObjects(sheetName) {
  const sheet = getDatabase().getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Hanya header atau kosong
  
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const rowObj = {};
    for (let j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = data[i][j];
    }
    rowObj._rowNumber = i + 1;
    // Beri fallback untuk sheets yang pakai id maupun _id
    if (headers.includes('id') && !rowObj.id) rowObj.id = (i + 1).toString();
    if (headers.includes('_id') && !rowObj._id) rowObj._id = (i + 1).toString();
    rows.push(rowObj);
  }
  return rows;
}

function appendToSheet(sheetName, dataObj, headers) {
  const db = getDatabase();
  let sheet = db.getSheetByName(sheetName);
  if (!sheet) {
    sheet = db.insertSheet(sheetName);
    sheet.appendRow(headers);
  }
  const row = [];
  for (const header of headers) {
    row.push(dataObj[header] !== undefined && dataObj[header] !== null ? dataObj[header] : "");
  }
  sheet.appendRow(row);
  return sheet.getLastRow();
}

function updateSheetRow(sheetName, rowNumber, dataObj, headers) {
  const sheet = getDatabase().getSheetByName(sheetName);
  if (!sheet) return;
  const row = [];
  for (const header of headers) {
    row.push(dataObj[header] !== undefined && dataObj[header] !== null ? dataObj[header] : "");
  }
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
}

function hashPassword(password) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  let txtHash = '';
  for (let i = 0; i < rawHash.length; i++) {
    let hashVal = rawHash[i];
    if (hashVal < 0) hashVal += 256;
    if (hashVal.toString(16).length == 1) txtHash += '0';
    txtHash += hashVal.toString(16);
  }
  return txtHash;
}

// ==========================================
// IMPLEMENTASI FITUR
// ==========================================

function handleLogin({ username, password }) {
  const users = getSheetDataAsObjects("users");
  const user = users.find(u => u.username === username);
  
  if (user) {
    const hashedInput = hashPassword(password);
    if (user.password === hashedInput || user.password === password) {
      return {
        success: true,
        user: { id: user.id, name: user.full_name, role: user.role, username: user.username }
      };
    }
  }
  return { success: false, message: "Invalid credentials" };
}

function handleRegister({ username, email, password, full_name, role }) {
  if (!username || !email || !password || !full_name) throw new Error("All fields are required");
  const users = getSheetDataAsObjects("users");
  if (users.some(u => u.username === username || u.email === email)) throw new Error("Username or Email already taken.");
  
  const hashedPassword = hashPassword(password);
  const newUser = {
    id: Utilities.getUuid(),
    username: username,
    email: email,
    password: hashedPassword,
    full_name: full_name,
    role: role || "kasir",
    created_at: new Date().toISOString(),
    reset_token: ""
  };
  
  const headers = ["id", "username", "email", "password", "full_name", "role", "created_at", "reset_token"];
  appendToSheet("users", newUser, headers);
  
  return {
    success: true,
    user: { id: newUser.id, name: full_name, role: newUser.role, username: username }
  };
}

function handleGetProducts() {
  const products = getSheetDataAsObjects("products");
  // Mapping API expecting `id` property
  const formatted = products.map(p => ({ ...p, id: p._id }));
  return { success: true, products: formatted };
}

function handleSearchProduct(label) {
  const products = handleGetProducts().products; 
  const product = products.find(p => p.ai_label === label || p.sku === label);
  if (product) {
    return { success: true, product: product };
  } else {
    return { success: false, message: "Product not found" };
  }
}

function handleCheckout({ header, items }) {
  const transactionId = Utilities.getUuid();
  
  const transaction = {
    _id: transactionId,
    invoice_number: header.invoice_number,
    total_price: header.total_price || 0,
    payment_method: header.payment_method || "",
    cash_received: header.cash_received || "",
    cash_return: header.cash_return || "",
    cashier_name: header.cashier_name || "",
    created_at: new Date().toISOString()
  };

  // Flattening items dynamically into transaction object
  items.forEach((item, index) => {
    transaction[`items[${index}].product_id`] = item.product_id || item.id || item._id;
    transaction[`items[${index}].name`] = item.name;
    transaction[`items[${index}].price`] = item.price;
    transaction[`items[${index}].quantity`] = item.quantity;
    transaction[`items[${index}].subtotal`] = item.subtotal || (parseFloat(item.quantity) * parseFloat(item.price));
  });
  
  const transactionsHeaders = [
    "_id", "invoice_number", 
    "items[0].product_id", "items[1].product_id", 
    "items[0].name", "items[1].name", 
    "items[0].price", "items[1].price", 
    "items[0].quantity", "items[1].quantity", 
    "items[0].subtotal", "items[1].subtotal", 
    "total_price", "payment_method", 
    "cash_received", "cash_return", "cashier_name", "created_at"
  ];
  
  appendToSheet("transactions", transaction, transactionsHeaders);
  
  const productsData = getSheetDataAsObjects("products");
  const productsHeaders = ["_id", "sku", "name", "price", "stock", "ai_label", "category", "image_url"];
  const invLogsHeaders = ["_id", "product_id", "type", "quantity", "note", "logged_by", "created_at", "product_name", "reason", "invoice_number"];
  
  for (const item of items) {
    const pIndex = productsData.findIndex(p => p._id === item.product_id || p._id === item.id || p.sku === item.product_id || p.name === item.name);
    if (pIndex !== -1) {
      const p = productsData[pIndex];
      let newStock = parseInt(p.stock) - parseInt(item.quantity);
      p.stock = newStock;
      
      updateSheetRow("products", p._rowNumber, p, productsHeaders);
      
      appendToSheet("inventory_logs", {
        _id: Utilities.getUuid(),
        product_id: p._id,
        type: 'out',
        quantity: item.quantity,
        note: 'sale',
        logged_by: header.cashier_name || 'System',
        created_at: new Date().toISOString(),
        product_name: p.name,
        reason: 'sale',
        invoice_number: header.invoice_number
      }, invLogsHeaders);
      
      if (newStock < 15) {
        appendToSheet("inventory_logs", {
          _id: Utilities.getUuid(),
          product_id: p._id,
          type: 'out',
          quantity: 0,
          note: 'Restock alert triggered',
          logged_by: 'System',
          created_at: new Date().toISOString(),
          product_name: p.name,
          reason: 'restock_alert',
          invoice_number: header.invoice_number
        }, invLogsHeaders);
      }
    }
  }
  
  // Also provide an `id` back for compatibility
  transaction.id = transaction._id;
  return { success: true, transaction: transaction };
}

function handleGetStoreSettings() {
  const settingsData = getSheetDataAsObjects("settings");
  if (settingsData.length > 0) {
    return { success: true, settings: settingsData[0] };
  } else {
    return { success: true, settings: { store_name: "Koperasi GIAT Modern AI Point of Sale System" } };
  }
}

function handleGetAnalytics(filter) {
  const transactions = getSheetDataAsObjects("transactions");
  let totalRevenue = 0;
  let totalOrders = 0;
  const topProductsMap = {};
  
  transactions.forEach(t => {
    totalRevenue += parseFloat(t.total_price || 0);
    totalOrders += 1;
    
    // Reverse logic from flattened structure
    for(let i=0; i<2; i++) {
        let name = t[`items[${i}].name`];
        if(!name) continue;
        let qty = parseFloat(t[`items[${i}].quantity`]) || 0;
        let subtotal = parseFloat(t[`items[${i}].subtotal`]) || 0;
        let pid = t[`items[${i}].product_id`];

        if (!topProductsMap[name]) {
          topProductsMap[name] = { _id: pid, name: name, quantity_sold: 0, revenue_generated: 0 };
        }
        topProductsMap[name].quantity_sold += qty;
        topProductsMap[name].revenue_generated += subtotal;
    }
  });
  
  const topProductsArray = Object.values(topProductsMap).sort((a,b) => b.quantity_sold - a.quantity_sold).slice(0, 5);
  
  return {
    success: true,
    data: {
      total_revenue: totalRevenue,
      total_orders: totalOrders,
      aov: totalOrders > 0 ? (totalRevenue / totalOrders) : 0,
      top_products: topProductsArray
    }
  };
}

function handleForgotPassword({ email }) {
    const users = getSheetDataAsObjects("users");
    const user = users.find(u => u.email === email);
    if (!user) return { success: false, message: "Email tidak ditemukan" };
    
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    user.reset_token = token;
    
    const headers = ["id", "username", "email", "password", "full_name", "role", "created_at", "reset_token"];
    updateSheetRow("users", user._rowNumber, user, headers);
    
    try {
      MailApp.sendEmail({
        to: email,
        subject: "AutoCashier AI - Reset Password",
        body: "Halo " + user.full_name + ",\n\nToken reset password Anda adalah: " + token + "\n\nTerima kasih."
      });
    } catch(err) {} // Ignore
    
    return { success: true, message: "Reset link sent via Email", token: token };
}

function handleResetPassword({ token, new_password }) {
    const users = getSheetDataAsObjects("users");
    const user = users.find(u => u.reset_token === token);
    
    if (!user || user.reset_token === "") return { success: false, message: "Token invalid atau sudah kedaluwarsa." };
    
    user.password = hashPassword(new_password);
    user.reset_token = ""; 
    
    const headers = ["id", "username", "email", "password", "full_name", "role", "created_at", "reset_token"];
    updateSheetRow("users", user._rowNumber, user, headers);
    
    return { success: true, message: "Password updated successfully" };
}

function handleUpdateUser({ username, full_name, new_password }) {
    const users = getSheetDataAsObjects("users");
    const user = users.find(u => u.username === username);
    if(!user) return { success: false, message: "User not found" };
    
    if(full_name) user.full_name = full_name;
    if(new_password) user.password = hashPassword(new_password);
    
    const headers = ["id", "username", "email", "password", "full_name", "role", "created_at", "reset_token"];
    updateSheetRow("users", user._rowNumber, user, headers);
    
    return {
       success: true,
       user: { id: user.id, name: user.full_name, role: user.role, username: user.username }
    };
}


// ==========================================
// DATABASE SEEDER (RUN ONCE)
// ==========================================
function runDatabaseSeeder() {
  const db = getDatabase();
  
  // 1. Definisi Skema Tabel (Headers)
  const schemas = {
    "users": ["id", "username", "email", "password", "full_name", "role", "created_at", "reset_token"],
    "products": ["_id", "sku", "name", "price", "stock", "ai_label", "category", "image_url"],
    "transactions": ["_id", "invoice_number", "items[0].product_id", "items[1].product_id", "items[0].name", "items[1].name", "items[0].price", "items[1].price", "items[0].quantity", "items[1].quantity", "items[0].subtotal", "items[1].subtotal", "total_price", "payment_method", "cash_received", "cash_return", "cashier_name", "created_at"],
    "inventory_logs": ["_id", "product_id", "type", "quantity", "note", "logged_by", "created_at", "product_name", "reason", "invoice_number"],
    "settings": ["_id", "store_name", "address", "phone", "footer_note"]
  };
  
  // 2. Buat Sheet jika belum ada
  for (let sheetName in schemas) {
    let sheet = db.getSheetByName(sheetName);
    if (!sheet) {
      sheet = db.insertSheet(sheetName);
      sheet.appendRow(schemas[sheetName]);
    }
  }
  
  const now = new Date().toISOString();
  
  // 3. SEED USERS (Hanya jika masih kosong)
  const userSheet = db.getSheetByName("users");
  if (userSheet.getLastRow() <= 1) {
    userSheet.appendRow([Utilities.getUuid(), "admin", "admin@koperasi.com", hashPassword("admin123"), "Super Admin", "admin", now, ""]);
    userSheet.appendRow([Utilities.getUuid(), "afa_kasir", "kasir@koperasi.com", hashPassword("password123"), "Dalfa Munawwarotul", "kasir", now, ""]);
  }
  
  // 4. SEED SETTINGS (Hanya jika masih kosong)
  const settingSheet = db.getSheetByName("settings");
  if (settingSheet.getLastRow() <= 1) {
    settingSheet.appendRow([Utilities.getUuid(), "Koperasi GIAT AI POS", "Jl. Teknologi AI No. 99, Jakarta", "0812-3456-7890", "Terima kasih telah berbelanja menggunakan sistem AI!"]);
  }

  // 5. SEED PRODUCTS (Hanya jika masih kosong)
  const prodSheet = db.getSheetByName("products");
  if (prodSheet.getLastRow() <= 1) {
    const products = [
      [Utilities.getUuid(), "BTL-AQUA", "Aqua Botol 600ml", 3500, 150, "bottle", "Minuman", ""],
      [Utilities.getUuid(), "BTL-COCA", "Coca Cola Botol", 6000, 100, "bottle", "Minuman", ""],
      [Utilities.getUuid(), "CUP-MIE1", "Pop Mie Rasa Ayam", 5500, 50, "cup", "Makanan Ringan", ""],
      [Utilities.getUuid(), "CUP-MIE2", "Pop Mie Sedap Baso", 5500, 60, "cup", "Makanan Ringan", ""],
      [Utilities.getUuid(), "HP-IP15P", "iPhone 15 Pro Max Dummy", 15000000, 5, "cell phone", "Elektronik", ""],
      [Utilities.getUuid(), "HP-S23U", "Samsung Galaxy S23 Ultra", 18000000, 3, "cell phone", "Elektronik", ""],
      [Utilities.getUuid(), "MOU-LOG1", "Logitech Wireless Mouse", 150000, 20, "mouse", "Komputer", ""],
      [Utilities.getUuid(), "SNA-CH01", "Chitato Sapi Panggang", 12000, 45, "snack", "Cemilan", ""]
    ];
    
    products.forEach(p => prodSheet.appendRow(p));
  }
  
  // 6. SEED DUMMY TRANSACTIONS & INVENTORY LOGS
  const trxSheet = db.getSheetByName("transactions");
  if (trxSheet.getLastRow() <= 1) {
    const trxId = Utilities.getUuid();
    // ["_id", "invoice_number", "items[0].product_id", "items[1].product_id", "items[0].name", "items[1].name", "items[0].price", "items[1].price", "items[0].quantity", "items[1].quantity", "items[0].subtotal", "items[1].subtotal", "total_price", "payment_method", "cash_received", "cash_return", "cashier_name", "created_at"]
    const dummyTrx = [
       trxId, "INV-10001", 
       "BTL-AQUA", "CUP-MIE1", 
       "Aqua Botol 600ml", "Pop Mie Rasa Ayam", 
       3500, 5500, 
       2, 1, 
       7000, 5500, 
       12500, "Cash", 
       15000, 2500, "Dalfa Munawwarotul", now
    ];
    trxSheet.appendRow(dummyTrx);
    
    // Insert logs
    const logSheet = db.getSheetByName("inventory_logs");
    logSheet.appendRow([Utilities.getUuid(), "BTL-AQUA", "out", 2, "sale", "Dalfa Munawwarotul", now, "Aqua Botol 600ml", "sale", "INV-10001"]);
    logSheet.appendRow([Utilities.getUuid(), "CUP-MIE1", "out", 1, "sale", "Dalfa Munawwarotul", now, "Pop Mie Rasa Ayam", "sale", "INV-10001"]);
  }
}

