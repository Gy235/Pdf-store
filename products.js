// ⚠️ Replace with your actual Chat ID
var CHAT_ID = "123456789";  // <-- CHANGE THIS
var TOKEN = "8640288110:AAENdRe0aAK3-GJpD-BuEDZNOnxJfxs67wQ";
var SHEET_URL = "https://docs.google.com/spreadsheets/d/16O71Klw_jMlj2aklXuz9XSgGZQqtBIalVUvwnGrSL2o/edit";

// Serve products from sheet
function doGet(e) {
  var sheet = SpreadsheetApp.openByUrl(SHEET_URL).getSheets()[0];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return sendJson([]);

  var headers = data[0];
  var products = [];
  for (var i = 1; i < data.length; i++) {
    products.push({
      name: data[i][0],
      price: data[i][1],
      image: data[i][2]
    });
  }
  return sendJson(products);
}

function sendJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Receive order
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var product = payload.product;
    var name = payload.name;
    var phone = payload.phone;
    var address = payload.address;
    var quantity = payload.quantity || 1;
    var transactionId = payload.transactionId;
    var screenshotBase64 = payload.screenshot; // full data URL

    // Build text message
    var message = "📦 *New Order!*\n" +
                  "🔹 Product: " + product + "\n" +
                  "👤 Name: " + name + "\n" +
                  "📞 Phone: " + phone + "\n" +
                  "📍 Address: " + address + "\n" +
                  "🔢 Qty: " + quantity + "\n" +
                  "🧾 Transaction ID: " + transactionId;

    // Send text first
    var textUrl = "https://api.telegram.org/bot" + TOKEN + "/sendMessage?chat_id=" + CHAT_ID +
                  "&text=" + encodeURIComponent(message) + "&parse_mode=Markdown";
    UrlFetchApp.fetch(textUrl);

    // Send screenshot as photo
    if (screenshotBase64 && screenshotBase64.startsWith("data:image")) {
      var blob = dataUrlToBlob(screenshotBase64);
      var formData = {
        'chat_id': CHAT_ID,
        'photo': blob
      };
      var options = {
        'method': 'post',
        'payload': formData
      };
      UrlFetchApp.fetch("https://api.telegram.org/bot" + TOKEN + "/sendPhoto", options);
    }

    return ContentService.createTextOutput("OK");
  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput("Error");
  }
}

// Convert base64 data URL to blob
function dataUrlToBlob(dataUrl) {
  var parts = dataUrl.split(',');
  var mime = parts[0].split(':')[1].split(';')[0];
  var bytes = Utilities.base64Decode(parts[1]);
  return Utilities.newBlob(bytes, mime, 'screenshot.jpg');
}
