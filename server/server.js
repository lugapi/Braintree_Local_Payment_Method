import "dotenv/config";
import express from "express";
import path from "path";
import braintree from "braintree";
import bodyParser from 'body-parser';

const app = express();

// Loading environment variables from the .env file
const {
  BRAINTREE_MERCHANT_ID,
  BRAINTREE_API_KEY,
  BRAINTREE_API_SECRET,
  BRAINTREE_CURRENCY,
  BRAINTREE_MAID,
  PORT
} = process.env;

// Configuring access to Braintree
const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: BRAINTREE_MERCHANT_ID,
  publicKey: BRAINTREE_API_KEY,
  privateKey: BRAINTREE_API_SECRET
});

// Middleware to parse URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to serve static files
app.use(express.static("client"));

app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join("views"));


app.get("/", async (req, res) => {
  res.render('template', {
    body: 'index',
    currency: BRAINTREE_CURRENCY,
    MID: BRAINTREE_MERCHANT_ID,
  });
});

app.get("/lpm", async (req, res) => {
  res.render('template', {
    body: 'lpm',
    currency: BRAINTREE_CURRENCY,
    MID: BRAINTREE_MERCHANT_ID,
    merchantAccountId: BRAINTREE_MAID
  });
});

app.get("/blikNoRedirection", async (req, res) => {
  res.render('template', {
    body: 'blik',
    currency: BRAINTREE_CURRENCY,
    MID: BRAINTREE_MERCHANT_ID,
    merchantAccountId: BRAINTREE_MAID
  });
});

app.get("/webhook", async (req, res) => {
  res.render('template', {
    body: 'webhook',
    currency: BRAINTREE_CURRENCY,
    MID: BRAINTREE_MERCHANT_ID,
  });
});


const generateAccessToken = async () => {
  try {
    const response = await gateway.clientToken.generate({
      merchantAccountId: BRAINTREE_MAID
    });

    const clientToken = response.clientToken;
    console.log("Client Token Generated:", clientToken);
    return clientToken;
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
    throw error;
  }
};

app.post("/clientToken", async (req, res) => {
  try {
    const clientToken = await generateAccessToken();
    return res.json({ clientToken });
  } catch (error) {
    console.error("Error generating Access Token:", error);
    res.status(500).send("Failed to generate Access Token");
  }
});

app.post("/webhooks", async (req, res) => {
  try {
    const webhookContent = req.body.bt_webhook;

    const params = new URLSearchParams(webhookContent);
    const bt_signature = params.get('bt_signature');
    const bt_payloadEncoded = params.get('bt_payload');

    console.log("bt_signature:", bt_signature);
    console.log("bt_payloadEncoded:", bt_payloadEncoded);

    if (!bt_signature || !bt_payloadEncoded) {
      throw new Error("Missing bt_signature or bt_payload");
    }

    const bt_payloadDecoded = Buffer.from(bt_payloadEncoded, 'base64').toString('utf-8');
    console.log("bt_payloadDecoded:", bt_payloadDecoded);

    const webhookNotification = await gateway.webhookNotification.parse(bt_signature, bt_payloadEncoded);

    console.log("[Webhook Received " + webhookNotification.timestamp + "] | Kind: " + webhookNotification.kind);
    console.log(webhookNotification);

    res.status(200).json({
      kind: webhookNotification.kind,
      timestamp: webhookNotification.timestamp,
      details: webhookNotification
    });
  } catch (error) {
    console.error("Error parsing webhook:", error);
    res.status(500).send("Error parsing webhook");
  }
});

app.listen(PORT, () => {
  console.log(`Node server listening at http://localhost:${PORT}/`);
});
