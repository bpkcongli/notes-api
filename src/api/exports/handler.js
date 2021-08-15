class ExportsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
    this.postExportNotesHandler = this.postExportNotesHandler.bind(this);
  }

  async postExportNotesHandler(request, reply) {
    this._validator.validateExportPayload(request.payload);

    const message = {
      userId: request.auth.credentials.id,
      targetEmail: request.payload.targetEmail,
    };

    await this._service.sendMessage('export:notes', JSON.stringify(message));

    return reply.response({
      'status': 'success',
      'message': 'Permintaan Anda dalam antrean',
    }).code(201);
  }
}

module.exports = ExportsHandler;
