const express = require("express");
const router = express.Router();
const NewRegistration = require("../models/NewRegistration");
const User = require("../models/User");
const axios = require("axios");
const SHEET_URL = process.env.SHEET_URL;
const CASHFREE_BASE_URL = "https://api.cashfree.com/pg";
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

router.post("/create-order", async (req, res) => {
  try {
    let { amount, email, phone } = req.body;

    // ✅ sanitize inputs
    email = email?.trim();
    phone = phone?.toString().replace(/\D/g, "");

    // ✅ validate phone
    if (!phone || phone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit phone number",
      });
    }

    // Check if email already exists
    if (
      (await User.findOne({ email: email })) ||
      (await NewRegistration.findOne({ email: email }))
    ) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const orderId = `order_${Date.now()}`;

    const request = {
      order_id: orderId,
      order_amount: Number(amount),
      order_currency: "INR",

      customer_details: {
        customer_id: `cust_${Date.now()}`,
        customer_email: email || "test@rixilab.tech",
        customer_phone: phone,
      },

      order_meta: {
        return_url: ` return_url: `${process.env.BASE_URL}/internship/payment/callback?order_id=${orderId}`,
      },
    };

    console.log("Cashfree Request:", request);

    const response = await axios.post(`${CASHFREE_BASE_URL}/orders`, request, {
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
      },
    });

    const paymentSessionId = response.data.payment_session_id;
    if (!paymentSessionId) {
      throw new Error("Payment session ID not received from Cashfree");
    }

    res.json({
      success: true,
      order_id: orderId,
      payment_session_id: paymentSessionId,
    });
  } catch (error) {
    console.error("Cashfree Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
});

router.post("/register", async (req, res) => {
  try {
    // console.log(req.body);
    const name = req.body["data[Name]"];
    const email = req.body["data[Email]"];
    const phone = req.body["data[Phone]"];
    const university = req.body["data[University]"];
    const college = req.body["data[College]"];
    const course = req.body["data[Course]"];
    const branch = req.body["data[Branch]"];
    const year_sem = req.body["data[Y/S]"];
    const domain = req.body["data[Domain]"];
    const duration = req.body["data[Duration]"];
    const referral_code = req.body["data[Referral_Code]"];
    const payID = req.body["data[PayID]"];
    const terms = req.body["data[Terms]"];

    // Validate required fields
    if (
      !name ||
      !email ||
      !phone ||
      !university ||
      !college ||
      !course ||
      !branch ||
      !year_sem ||
      !domain ||
      !duration ||
      !terms
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }
    if (
      (await User.findOne({ email: email })) ||
      (await NewRegistration.findOne({ email: email }))
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }
    // Save to NewRegistration
    const newReg = new NewRegistration({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      university: university.trim(),
      college: college.trim(),
      course: course.trim(),
      branch: branch.trim(),
      year_sem: year_sem.trim(),
      domain: domain.trim(),
      duration: parseInt(duration) || 4,
      referral_code: referral_code ? referral_code.trim() : "",
      payID: payID ? payID.trim() : "",
      terms: terms === "on",
    });

    await newReg.save();
    const timestampMs = Date.now();
    const d = new Date(timestampMs);

    const pad = (n) => String(n).padStart(2, "0");

    let hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12; // 0 -> 12

    const formattedTimestamp =
      `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ` +
      `${pad(hours)}:${minutes}:${seconds} ${ampm}`;

    // Send to sheets
    try {
      const sheetData = {
        Name: name.trim(),
        Email: email.trim(),
        Phone: phone.trim(),
        University: university.trim(),
        College: college.trim(),
        Course: course.trim(),
        Branch: branch.trim(),
        "Y/S": year_sem.trim(),
        Domain: domain.trim(),
        Duration: parseInt(duration) || 4,
        Referral_Code: referral_code ? referral_code.trim() : "",
        PayID: payID ? payID.trim() : "",
        Terms: terms === "on" ? "Yes" : "No",
        Timestamp: formattedTimestamp,
      };

      await axios.post(SHEET_URL, {
        data: sheetData,
      });
    } catch (sheetError) {
      console.error("Failed to send to sheet:", sheetError.message);
      // Continue with registration even if sheet fails
    }

    res.json({
      success: true,
      message: "Registration submitted successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/payment/callback", async (req, res) => {
  try {
    const { order_id } = req.query;
    if (!order_id) {
      return res.redirect("/internship?payment_success=false");
    }
    // Verify payment
    const response = await axios.get(
      `${CASHFREE_BASE_URL}/orders/${order_id}/payments`,
      {
        headers: {
          "x-api-version": "2023-08-01",
          "x-client-id": CASHFREE_APP_ID,
          "x-client-secret": CASHFREE_SECRET_KEY,
        },
      }
    );
    const payments = response.data;
    const payment = payments[0];
    if (payment && payment.payment_status === "SUCCESS") {
      const invoiceUrl = payment.invoice_url || "";
      const transactionId = payment.cf_payment_id || order_id; // Use cf_payment_id as transaction_id, fallback to order_id
      await NewRegistration.findOneAndUpdate(
        { email: payment.customer_details.customer_email },
        { payID: transactionId }
      );
      res.redirect(
        "/internship?payment_success=true&order_id=" +
          order_id +
          "&transaction_id=" +
          transactionId +
          "&invoice_url=" +
          encodeURIComponent(invoiceUrl)
      );
    } else {
      res.redirect("/internship?payment_success=false");
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.redirect("/internship?payment_success=false");
  }
});

module.exports = router;
