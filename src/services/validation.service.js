class ValidationService {
  validateBookingDetails(details) {
    const required = ['name', 'date', 'time', 'description'];
    const missing = required.filter(field => !details[field]);
    
    if (missing.length > 0) {
      return {
        valid: false,
        error: `Missing required fields: ${missing.join(', ')}`
      };
    }

    // Validate date and time
    const bookingDate = new Date(`${details.date} ${details.time}`);
    if (isNaN(bookingDate.getTime())) {
      return {
        valid: false,
        error: 'Invalid date or time format'
      };
    }

    // Check if date is in the future
    if (bookingDate <= new Date()) {
      return {
        valid: false,
        error: 'Booking date must be in the future'
      };
    }

    return { valid: true };
  }

  validateQuotationDetails(details) {
    const required = ['name', 'requirements'];
    const missing = required.filter(field => !details[field]);
    
    if (missing.length > 0) {
      return {
        valid: false,
        error: `Missing required fields: ${missing.join(', ')}`
      };
    }

    return { valid: true };
  }

  validatePaymentDetails(details) {
    const required = ['amount', 'service', 'paymentMethod'];
    const missing = required.filter(field => !details[field]);
    
    if (missing.length > 0) {
      return {
        valid: false,
        error: `Missing required fields: ${missing.join(', ')}`
      };
    }

    // Validate amount
    if (isNaN(details.amount) || details.amount <= 0) {
      return {
        valid: false,
        error: 'Invalid payment amount'
      };
    }

    // Validate payment method
    const validPaymentMethods = ['credit_card', 'debit_card', 'bank_transfer'];
    if (!validPaymentMethods.includes(details.paymentMethod)) {
      return {
        valid: false,
        error: 'Invalid payment method'
      };
    }

    return { valid: true };
  }

  parseBookingString(bookingString) {
    try {
      const details = bookingString.substring(bookingString.indexOf('Book:') + 5).trim();
      const [name, date, time, ...descParts] = details.split(',').map(p => p.trim());
      
      return {
        name,
        date,
        time,
        description: descParts.join(',').trim()
      };
    } catch (error) {
      return null;
    }
  }

  parseQuotationString(quoteString) {
    try {
      const details = quoteString.substring(quoteString.indexOf('Quote:') + 6).trim();
      const [name, ...reqParts] = details.split(',').map(p => p.trim());
      
      return {
        name,
        requirements: reqParts.join(',').trim()
      };
    } catch (error) {
      return null;
    }
  }
}

export const validationService = new ValidationService();
export default validationService;
