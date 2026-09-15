class BusinessError extends Error {
  constructor(message, status = 400, code = 'VALIDATION_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
    this.expose = true;
  }
}

module.exports = BusinessError;
