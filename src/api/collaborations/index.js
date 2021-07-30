const routes = require('./routes');
const CollaborationsHandler = require('./handler');

module.exports = {
  name: 'collaborations',
  version: '1.0.0',
  register: async (server, {notesService, collaborationsService, validator}) => {
    const collaborationsHandler = new CollaborationsHandler(
        notesService,
        collaborationsService,
        validator,
    );
    server.route(routes(collaborationsHandler));
  },
};
