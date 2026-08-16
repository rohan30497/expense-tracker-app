/**
 * Google Apps Script - Automated Gmail Expense Alert Parser
 *
 * Setup:
 * 1. Open Apps Script project and paste this code to Code.gs
 * 2. Update the Render backend URL and secret below or set them in Script Properties
 * 3. Add a trigger: function processBankEmails, event source: Time-driven, type: Day timer, every 24 hours
 * 4. Save and let it run automatically
 */

const CONFIG = {
  BACKEND_URL: "https://expense-tracker-app-z867.onrender.com/api/process-email",
  API_SECRET_TOKEN: "my-secret-webhook-token",
  GMAIL_QUERY: "from:alerts@axis.bank.in newer_than:1d (subject:debited OR subject:spent OR subject:transaction) -label:Expense/Processed",
  PROCESSED_LABEL: "Expense/Processed",
  MAX_THREADS_PER_RUN: 25
};

function initializeScriptConfig() {
  const props = PropertiesService.getScriptProperties();
  const backendUrl = props.getProperty("BACKEND_URL");
  const token = props.getProperty("API_SECRET_TOKEN");

  if (backendUrl) {
    CONFIG.BACKEND_URL = backendUrl;
  }

  if (token) {
    CONFIG.API_SECRET_TOKEN = token;
  }

  Logger.log("Configured backend URL: " + CONFIG.BACKEND_URL);
}

function processBankEmails() {
  initializeScriptConfig();

  const label = getOrCreateLabel(CONFIG.PROCESSED_LABEL);
  const threads = GmailApp.search(CONFIG.GMAIL_QUERY, 0, CONFIG.MAX_THREADS_PER_RUN);

  Logger.log("Found " + threads.length + " unprocessed email thread(s) in the last 24 hours.");

  for (let i = 0; i < threads.length; i++) {
    const messages = threads[i].getMessages();

    for (let j = 0; j < messages.length; j++) {
      const msg = messages[j];
      const subject = msg.getSubject() || "No Subject";
      const body = msg.getPlainBody() || "";

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
        const responseText = response.getContentText();
        Logger.log("Processed email: " + subject + " -> " + responseText);
      } catch (err) {
        Logger.log("Error posting email to backend: " + err.toString());
      }
    }

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

function testProcessLatestAxisEmail() {
  initializeScriptConfig();

  const threads = GmailApp.search("from:alerts@axis.bank.in newer_than:1d (debited OR spent OR transaction)", 0, 1);
  if (threads.length === 0) {
    Logger.log("No matching bank emails found in the last 24 hours.");
    return;
  }

  const msg = threads[0].getMessages()[0];
  const payload = {
    subject: msg.getSubject() || "No Subject",
    body: msg.getPlainBody() || "",
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

function setScriptPropertiesForBackend() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty("BACKEND_URL", "https://expense-tracker-app-z867.onrender.com/api/process-email");
  props.setProperty("API_SECRET_TOKEN", "my-secret-webhook-token");
  Logger.log("Script properties saved for backend URL and API secret.");
}

