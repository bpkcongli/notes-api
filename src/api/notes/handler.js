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
    this._validator.validateNotePayload(request.payload);
    const credentialId = request.auth.credentials.id;
    const {title = 'untitled', tags, body} = request.payload;
    const noteId = await this._service.addNote({title, tags, body, owner: credentialId});

    return reply.response({
      'status': 'success',
      'message': 'Catatan berhasil ditambahkan',
      'data': {
        noteId,
      },
    }).code(201).type('application/json');
  }

  async getNotesHandler(request, reply) {
    const credentialId = request.auth.credentials.id;
    const notes = await this._service.getNotes(credentialId);

    return reply.response({
      'status': 'success',
      'data': {
        notes,
      },
    }).code(200).type('application/json');
  }

  async getNoteByIdHandler(request, reply) {
    const credentialId = request.auth.credentials.id;
    const {id} = request.params;

    await this._service.verifyNoteAccess(id, credentialId);
    const note = await this._service.getNoteById(id);

    return reply.response({
      'status': 'success',
      'data': {
        note,
      },
    }).code(200).type('application/json');
  }

  async putNoteByIdHandler(request, reply) {
    this._validator.validateNotePayload(request.payload);
    const credentialId = request.auth.credentials.id;
    const {id} = request.params;

    await this._service.verifyNoteAccess(id, credentialId);
    await this._service.editNoteById(id, request.payload);

    return reply.response({
      'status': 'success',
      'message': 'Catatan berhasil diperbaharui',
    }).code(200).type('application/json');
  }

  async deleteNoteByIdHandler(request, reply) {
    const credentialId = request.auth.credentials.id;
    const {id} = request.params;

    await this._service.verifyNoteOwner(id, credentialId);
    await this._service.deleteNoteById(id);

    return reply.response({
      'status': 'success',
      'message': 'Catatan berhasil dihapus',
    }).code(200).type('application/json');
  }
}

module.exports = NotesHandler;
