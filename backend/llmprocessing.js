// testGemini.js
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("ERROR: Missing GEMINI_API_KEY in .env.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const MODEL_NAME = "gemini-1.5-pro-002";

async function scanPurchaseBill(fileData, mimeType) {
  const prompt = `
      Extract information from this purchase bill and follow the response schema strictly.
      Report the invoiceDate in the format YYYY-MM-DD.
       Distributor Data:
  distributorName: is the name of the distributor,
  distributorMob: is the mobile number of the distributor,
  distributorAddress: is the address of the distributor,
  distributorGstin: is the GSTIN of the distributor,
  distributorEmail: is the email of the distributor,
  distributorBankNumber: is the bank account number of the distributor, also called as account number ,
  distributorDlNumber: is the Drug License number of the distributor also abbreviated as DL, D.L, DL No, DL Number, DL No. etc,
  distributorBankIfsc: is the bank IFSC code of the distributor also called as IFSC code,
      Discount is sometimes shown in the bills as D% , Disc , D.
      Pack is sometimes shon aslong sise the prodcut name as 1*5 , 10*10 , 10*100 etc, which means 5,10,100 pack size .
      Report the expiry date in the product list in the format MM/YY or mm/yy , expiry date in the bill can be in the fomrat like MAY-25 or may-25 which should be translated to 05/25.
     Quantity & Direct Free Area ("Qty" Column or Similar):
  This area contains the purchased quantity and any free items directly associated with it.
 
  quantity (Integer/Float): The purchased amount.
  
  e.g., 10+1 → quantity is 10, 5-2 → quantity is 5, 50 → quantity is 50
  
  free (Integer/Float): Free items from the quantity area only.
  
  e.g., 10+1 → free is 1, 5-2 → free is 2, 50 → free is 0
  
  Free is only extracted from + or - next to quantity (e.g., 10+1, 10-1, Free: 5).
  
  2. Scheme Information Area (Brackets or Remarks Columns):
  This area contains promotional scheme details, often in brackets ( ), [ ], or following terms like "Scheme," "Offer," or "Remarks."
  
  schemeInput1 (Number or String): First scheme value (before + or -).
  
  schemeInput2 (Number or String/null): Second scheme value (after + or -).
  
  From (X+Y), schemeInput1 = X, schemeInput2 = Y
  
  From (X), schemeInput1 = X, schemeInput2 = null
  
      Ensure all fields are populated accurately. If a field is not present in the bill, set its value to null unless a default is specified in the schema or instructions.
      
      `;

  const productsSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        productName: { type: Type.STRING },
        batchNumber: { type: Type.STRING },
        mfcName: { type: Type.STRING },
        expiry: { type: Type.STRING },
        HSN: { type: Type.STRING },
        mrp: { type: Type.NUMBER },
        quantity: { type: Type.NUMBER },
        pack: { type: Type.NUMBER },
        purchaseRate: { type: Type.NUMBER },

        discount: { type: Type.NUMBER },
        gstPer: { type: Type.NUMBER },
        amount: { type: Type.NUMBER },
      },
      required: [
        "productName",
        "batchNumber",
        "mfcName",
        "expiry",
        "HSN",
        "mrp",
        "quantity",
        "pack",
        "purchaseRate",
        "discount",
        "gstPer",
        "amount",
      ],
    },
  };

  const billSummarySchema = {
    type: Type.OBJECT,
    properties: {
      subtotal: { type: Type.NUMBER },
      discountAmount: { type: Type.NUMBER },
      taxableAmount: { type: Type.NUMBER },
      gstAmount: { type: Type.NUMBER },
      adjustment: { type: Type.NUMBER },
      totalQuantity: { type: Type.NUMBER },
      productCount: { type: Type.NUMBER },
      grandTotal: { type: Type.NUMBER },
    },
  };

  const structuredResponseSchema = {
    type: Type.OBJECT,
    properties: {
      invoiceNumber: { type: Type.STRING },
      distributorName: { type: Type.STRING },
      distributorMob: { type: Type.STRING },
      distributorAddress: { type: Type.STRING },
      distributorGstin: { type: Type.STRING },
      distributorEmail: { type: Type.STRING },
      distributorBankNumber: { type: Type.STRING },
      distributorBankIfsc: { type: Type.STRING },
      distributorDlNumber: { type: Type.STRING },
      invoiceDate: { type: Type.STRING },
      grandTotal: { type: Type.NUMBER },
      withGst: { type: Type.BOOLEAN },
      products: productsSchema,
      billSummary: billSummarySchema,
    },
    required: [
      "invoiceNumber",
      "distributorName",
      "invoiceDate",
      "grandTotal",
      "withGst",
    ],
  };

  const generationConfig = {
    responseMimeType: "application/json",
    responseSchema: structuredResponseSchema,
  };

  const contents = [
    {
      role: "user",
      parts: [
        { text: prompt },
        { inlineData: { mimeType: mimeType || "image/jpeg", data: fileData } },
      ],
    },
  ];


  try {
    const streamResponse = await ai.models.generateContentStream({
      model: MODEL_NAME,
      config: generationConfig,
      contents,
    });

    let accumulatedJson = "";
    for await (const chunk of streamResponse) {
      let textContent = "";
      if (typeof chunk.text === "function") {
        textContent = chunk.text();
      } else if (chunk.text !== undefined && chunk.text !== null) {
        textContent = chunk.text;
      }
      accumulatedJson += textContent;
    }

    // Remove markdown delimiters if present
    let parsableJson = accumulatedJson.trim();
    if (parsableJson.startsWith("```json")) {
      parsableJson = parsableJson.substring(7);
    }
    if (parsableJson.endsWith("```")) {
      parsableJson = parsableJson.substring(0, parsableJson.length - 3);
    }
    parsableJson = parsableJson.trim(); // Trim again in case of whitespace after removal


    if (!parsableJson) {
      // Check the cleaned string
      console.error("Empty accumulated JSON from stream after cleaning.");
      throw new Error(
        "Received empty or whitespace-only JSON response from Gemini API via stream."
      );
    }


    try {
      return JSON.parse(parsableJson);
    } catch (parseError) {
      console.error(
        "Error parsing JSON response from Gemini (stream):",
        parseError
      );
      console.error(
        "Raw Gemini text response (for debugging after cleaning attempt):",
        parsableJson // Log the cleaned string on error too
      );
      throw new Error(
        "Failed to parse JSON response from Gemini (stream): " +
          parseError.message
      );
    }
  } catch (error) {
    console.error(
      "Error during Gemini API stream call or JSON parsing:",
      error
    );
    if (error.response && error.response?.promptFeedback) {
      console.error(
        "Prompt Feedback:",
        JSON.stringify(error.response.promptFeedback, null, 2)
      );
    }
    throw new Error(
      "Failed to extract data from bill image (stream): " + error.message
    );
  }
}

// --- Main Test Function ---
export const llmProcessing = async (fileData, mimeType) => {
  try {
    console.time("scanPurchaseBill");
    const extractedData = await scanPurchaseBill(fileData, mimeType);
    console.timeEnd("scanPurchaseBill");
  
    return extractedData;
  } catch (error) {
    console.error("\n--- Test Failed ---");
    console.error(error.message);
    if (error.cause) {
      console.error("Cause:", error.cause);
    }
    throw error; // Re-throw the error to be handled by the caller
  }
};
