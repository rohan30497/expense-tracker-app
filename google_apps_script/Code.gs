/**
 * Google Apps Script - Automated Gmail Expense Alert Parser
 * 
 * HOW TO SET UP (2 Minutes):
 * 1. Go to https://script.google.com
 * 2. Click "New Project" and paste this code into Code.gs
 * 3. Replace BACKEND_URL with your deployed Python API URL (e.g. Vercel/Render URL or local ngrok)
 * 4. Click "Triggers" (clock icon on left menu) -> Add Trigger:
 *    - Function: processBankEmails
 *    - Event Source: Time-driven
 *    - Type: Minutes timer (Every 5 minutes)
 * 5. Save. It will now run 24/7 automatically in Google Cloud!
 */

const CONFIG = {
  // Your deployed Python Backend Webhook URL (Render / Vercel / localtunnel)
  BACKEND_URL: "https://small-peas-greet.loca.lt/api/process-email",
  API_SECRET_TOKEN: "my-secret-webhook-token",
  
  // Gmail search query for bank transaction alerts
  GMAIL_QUERY: "from:alerts@axis.bank.in (subject:debited OR subject:spent OR subject:transaction) -label:Expense/Processed",
  
  PROCESSED_LABEL: "Expense/Processed"
};

function processBankEmails() {
  const label = getOrCreateLabel(CONFIG.PROCESSED_LABEL);
  const threads = GmailApp.search(CONFIG.GMAIL_QUERY, 0, 10);
  
  Logger.log("Found " + threads.length + " unprocessed email threads.");
  
  for (let i = 0; i < threads.length; i++) {
    const messages = threads[i].getMessages();
    for (let j = 0; j < messages.length; j++) {
      const msg = messages[j];
      const subject = msg.getSubject();
      const body = msg.getPlainBody();
      
      try {
        const payload = {
          subject: subject,
          body: body,
          secret_token: CONFIG.API_SECRET_TOKEN
        };
        
        const options = {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        };
        
        const response = UrlFetchApp.fetch(CONFIG.BACKEND_URL, options);
        Logger.log("Processed email: " + subject + " -> Response: " + response.getContentText());
        
      } catch (err) {
        Logger.log("Error posting to backend: " + err.toString());
      }
    }
    
    // Label thread as processed so it is skipped next time
    threads[i].addLabel(label);
  }
}

function getOrCreateLabel(labelName) {
  let label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    label = GmailApp.createLabel(labelName);
  }
  return label;
}

/**
 * Helper function to test scanning your latest Axis Bank email without marking it processed.
 * Use this to verify setup in Google Apps Script editor!
 */
function testProcessLatestAxisEmail() {
  const threads = GmailApp.search("from:alerts@axis.bank.in (debited OR spent OR transaction)", 0, 1);
  if (threads.length === 0) {
    Logger.log("No Axis Bank transaction alert emails found in Gmail inbox.");
    return;
  }
  const msg = threads[0].getMessages()[0];
  Logger.log("Found email subject: " + msg.getSubject());
  Logger.log("Posting to backend: " + CONFIG.BACKEND_URL);
  
  const payload = {
    subject: msg.getSubject(),
    body: msg.getPlainBody(),
    secret_token: CONFIG.API_SECRET_TOKEN
  };
  
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(CONFIG.BACKEND_URL, options);
  Logger.log("Backend Response: " + response.getContentText());
}

