require('dotenv').config();
const Hapi = require('@hapi/hapi');
const notes = require('./api/notes/index');
const NotesService = require('./services/postgres/NotesService');
const NotesValidator = require('./validator/notes/index');

const init = async () => {
  const server = Hapi.server({
    port: process.env.SRVPORT,
    host: (process.env.NODE_ENV !== 'production') ? process.env.SRVHOST : '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  const notesService = new NotesService();

  await server.register({
    plugin: notes,
    options: {
      service: notesService,
      validator: NotesValidator,
    },
  });
  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
