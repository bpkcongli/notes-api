require('dotenv').config();
const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');

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

  // initiate all services
  const notesService = new NotesService();
  const usersService = new UsersService();
  const authenticationsService = new AuthenticationsService();

  // error handling automatically run before the response is sent
  server.ext('onPreResponse', (request, h) => {
    const {response} = request;

    if (response instanceof ClientError) {
      return h.response({
        'status': 'fail',
        'message': response.message,
      }).code(response.statusCode);
    } else if (response.isServer) {
      return h.response({
        'status': 'error',
        'message': 'Maaf, terjadi kegagalan pada server kami.',
      }).code(500);
    } else if (response.isBoom) {
      return h.response({
        'status': 'fail',
        'message': response.output.payload.message,
      }).code(response.output.payload.statusCode);
    }

    return response.continue || response;
  });

  // Using external plugin (Jwt)
  await server.register([
    {
      plugin: Jwt,
    },
  ]);

  // create authentication strategy using jwt schema
  server.auth.strategy('notesapp_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  // using internal plugin
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
