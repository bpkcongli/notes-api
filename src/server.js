require('dotenv').config();
const Hapi = require('@hapi/hapi');

const notes = require('./api/notes/index');
const NotesService = require('./services/postgres/NotesService');
const NotesValidator = require('./validator/notes/index');

const users = require('./api/users/index');
const UsersService = require('./services/postgres/UsersService');
const UsersValidator = require('./validator/users/index');

const authentications = require('./api/authentications/index');
const AuthenticationsService = require('./services/postgres/AuthenticationsService');
const AuthenticationsValidator = require('./validator/authentications/index');

const TokenManager = require('./tokenize/TokenManager');

const ClientError = require('./exceptions/ClientError');

const init = async () => {
  const server = Hapi.server({
    port: process.env.SRVPORT,
    host: process.env.SRVHOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  const notesService = new NotesService();
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();

  server.ext('onPreResponse', (request, h) => {
    const {response} = request;

    if (response instanceof ClientError) {
      return h.response({
        'status': 'fail',
        'message': response.message,
      }).code(response.statusCode);
    } else if (response instanceof Error) {
      return h.response({
        'status': 'error',
        'message': 'Maaf, terjadi kegagalan pada server kami.',
      }).code(500);
    }

    return response.continue || response;
  });

  await server.register([
    {
      plugin: notes,
      options: {
        service: notesService,
        validator: NotesValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: usersService,
        validator: UsersValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService,
        usersService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
  ]);
  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
