const ClientError = require('../../exceptions/ClientError');

class NotesHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
    this.postNoteHandler = this.postNoteHandler.bind(this);
    this.getNotesHandler = this.getNotesHandler.bind(this);
    this.getNoteByIdHandler = this.getNoteByIdHandler.bind(this);
    this.putNoteByIdHandler = this.putNoteByIdHandler.bind(this);
    this.deleteNoteByIdHandler = this.deleteNoteByIdHandler.bind(this);
  }

  async postNoteHandler(request, reply) {
    try {
      this._validator.validateNotePayload(request.payload);
      const {title = 'untitled', tags, body} = request.payload;
      const noteId = await this._service.addNote({title, tags, body});

      return reply.response({
        'status': 'success',
        'message': 'Catatan berhasil ditambahkan',
        'data': {
          noteId,
        },
      }).code(201).type('application/json');
    } catch (error) {
      const {response, statusCode} = this._errorHandler(error);
      return reply.response(response).code(statusCode).type('application/json');
    }
  }

  async getNotesHandler(_, reply) {
    const notes = await this._service.getNotes();

    return reply.response({
      'status': 'success',
      'data': {
        notes,
      },
    }).code(200).type('application/json');
  }

  async getNoteByIdHandler(request, reply) {
    try {
      const {id} = request.params;
      const note = await this._service.getNoteById(id);

      return reply.response({
        'status': 'success',
        'data': {
          note,
        },
      }).code(200).type('application/json');
    } catch (error) {
      const {response, statusCode} = this._errorHandler(error);
      return reply.response(response).code(statusCode).type('application/json');
    }
  }

  async putNoteByIdHandler(request, reply) {
    try {
      const {id} = request.params;
      this._validator.validateNotePayload(request.payload);
      await this._service.editNoteById(id, request.payload);

      return reply.response({
        'status': 'success',
        'message': 'Catatan berhasil diperbaharui',
      }).code(200).type('application/json');
    } catch (error) {
      const {response, statusCode} = this._errorHandler(error);
      return reply.response(response).code(statusCode).type('application/json');
    }
  }

  async deleteNoteByIdHandler(request, reply) {
    try {
      const {id} = request.params;
      await this._service.deleteNoteById(id);

      return reply.response({
        'status': 'success',
        'message': 'Catatan berhasil dihapus',
      }).code(200).type('application/json');
    } catch (error) {
      const {response, statusCode} = this._errorHandler(error);
      return reply.response(response).code(statusCode).type('application/json');
    }
  }

  _errorHandler(error) {
    if (error instanceof ClientError) {
      const response = {
        'status': 'fail',
        'message': error.message,
      };
      return {response, statusCode: error.statusCode};
    } else {
      const response = {
        'status': 'error',
        'message': 'Maaf, terjadi kegagalan pada server kami.',
      };
      return {response, statusCode: 500};
    }
  }
}

module.exports = NotesHandler;
