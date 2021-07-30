class CollaborationsHandler {
  constructor(notesService, collaborationsService, validator) {
    this._notesService = notesService;
    this._collaborationsService = collaborationsService;
    this._validator = validator;
    this.postCollaborationHandler = this.postCollaborationHandler.bind(this);
    this.deleteCollaborationHandler = this.deleteCollaborationHandler.bind(this);
  }

  async postCollaborationHandler(request, reply) {
    this._validator.validateCollaborationPayload(request.payload);
    const credentialId = request.auth.credentials.id;
    const {noteId, userId} = request.payload;

    await this._notesService.verifyNoteOwner(noteId, credentialId);
    const collaborationId = await this._collaborationsService.addCollaboration(noteId, userId);

    return reply.response({
      'status': 'success',
      'message': 'Kolaborasi berhasil ditambahkan',
      'data': {
        collaborationId,
      },
    }).code(201);
  }

  async deleteCollaborationHandler(request) {
    this._validator.validateCollaborationPayload(request.payload);
    const credentialId = request.auth.credentials.id;
    const {noteId, userId} = request.payload;

    await this._notesService.verifyNoteOwner(noteId, credentialId);
    await this._collaborationsService.deleteCollaboration(noteId, userId);

    return {
      'status': 'success',
      'message': 'Kolaborasi berhasil dihapus',
    };
  }
}

module.exports = CollaborationsHandler;
