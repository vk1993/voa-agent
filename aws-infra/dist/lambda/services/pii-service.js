"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskPII = maskPII;
/**
 * Enterprise PII Masking Service.
 * Scrub sensitive customer PII (credit cards, emails, phone numbers)
 * from voice call transcripts before they are logged or persisted.
 */
function maskPII(text) {
    if (!text)
        return "";
    let redactedText = text;
    // A. Redact Credit Card Numbers
    // Matches typical 13 to 16 digit credit card patterns separated by spaces or hyphens
    const creditCardRegex = /\b(?:\d[ -]*?){13,16}\b/g;
    redactedText = redactedText.replace(creditCardRegex, (match) => {
        // Avoid redacting standard short number patterns like years (e.g. 2026) or small numbers
        const cleanDigits = match.replace(/[- ]/g, "");
        if (cleanDigits.length >= 13 && cleanDigits.length <= 16) {
            return "[CREDIT_CARD_REDACTED]";
        }
        return match;
    });
    // B. Redact Email Addresses
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    redactedText = redactedText.replace(emailRegex, "[EMAIL_REDACTED]");
    // C. Redact Phone Numbers
    // Matches international (+91, +1) and standard local 10-digit mobile numbers
    const phoneRegex = /(?:\+?91[-.\s]??)?[6-9]\d{9}|(?:\+?1[-.\s]??)?\(?\d{3}\)?[-.\s]??\d{3}[-.\s]??\d{4}/g;
    redactedText = redactedText.replace(phoneRegex, "[PHONE_REDACTED]");
    return redactedText;
}
