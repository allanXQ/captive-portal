const { parsePhoneNumberFromString } = require("libphonenumber-js");
class InvalidPhoneNumber extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidPhoneNumber";
  }
}

const normalizePhoneNumber = (rawPhoneNumber) => {
  if (
    rawPhoneNumber === null ||
    rawPhoneNumber === undefined ||
    rawPhoneNumber === ""
  ) {
    return rawPhoneNumber;
  }

  const asString = String(rawPhoneNumber).trim();

  // Parse with Kenya as default region. This accepts local formats like 0712... and
  // international formats like +254712....
  const phoneNumber = parsePhoneNumberFromString(asString, "KE");
  if (!phoneNumber || !phoneNumber.isValid()) {
    throw new InvalidPhoneNumber(`Invalid phone number: ${rawPhoneNumber}`);
  }

  // Ensure the number belongs to Kenya (KE)
  if (phoneNumber.country !== "KE") {
    throw new InvalidPhoneNumber(
      `Only Kenyan phone numbers are supported: ${rawPhoneNumber}`,
    );
  }

  // Return digits-only national format with country code (e.g. 2547xxxxxxxx)
  const e164 = phoneNumber.format("E.164"); // +2547...
  return e164.startsWith("+") ? e164.slice(1) : e164;
};

module.exports = { normalizePhoneNumber, InvalidPhoneNumber };
