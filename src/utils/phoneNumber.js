const normalizePhoneNumber = (rawPhoneNumber) => {
  if (!rawPhoneNumber) {
    return rawPhoneNumber;
  }

  let phone = String(rawPhoneNumber).trim();
  phone = phone.replace(/[\s-]/g, "");

  if (phone.startsWith("+")) {
    phone = phone.slice(1);
  }

  if (phone.startsWith("07") || phone.startsWith("01")) {
    phone = `254${phone.slice(1)}`;
  }

  if (phone.startsWith("254")) {
    phone = phone;
  }
  return phone;
};

module.exports = { normalizePhoneNumber };
