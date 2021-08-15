class UploadsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
    this.postUploadImageHandler = this.postUploadImageHandler.bind(this);
  }

  async postUploadImageHandler(request, reply) {
    const {data} = request.payload;
    this._validator.validateImageHeaders(data.hapi.headers);

    const filename = await this._service.writeFile(data, data.hapi);

    return reply.response({
      'status': 'success',
      'data': {
        'fileLocation': `http://${process.env.SRVHOST}:${process.env.SRVPORT}/upload/images/${filename}`,
      },
    }).code(201);
  }
}

module.exports = UploadsHandler;
