class UsersHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;
    this.postUserHandler = this.postUserHandler.bind(this);
    this.getUserByIdHandler = this.getUserByIdHandler.bind(this);
  }

  async postUserHandler(request, reply) {
    try {
      this._validator.validateUserPayload(request.payload);

      const {username, password, fullname} = request.payload;
      const userId = this._service.addUser({username, password, fullname});

      return reply.response({
        'status': 'success',
        'message': 'User berhasil ditambahkan',
        'data': {
          userId,
        },
      }).code(201);
    } catch (error) {
      // TODO: error handling
    }
  }

  async getUserByIdHandler(request, reply) {
    try {
      const {id} = request.params;
      const user = await this._service.getUserById(id);

      return {
        'status': 'success',
        'data': {
          user,
        },
      };
    } catch (error) {
      // TODO: error handling
    }
  }
}

module.exports = UsersHandler;
