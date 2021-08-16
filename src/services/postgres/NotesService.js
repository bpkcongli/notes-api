const {Pool} = require('pg');
const {nanoid} = require('nanoid');
const {mapDBToModel} = require('../../utils/index');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class NotesService {
  constructor(collaborationsService, cacheService) {
    this._pool = new Pool({
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      port: process.env.PGPORT,
    });
    this._collaborationsService = collaborationsService;
    this._cacheService = cacheService;
  }

  async addNote({title, body, tags, owner}) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO notes VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, title, body, tags, createdAt, updatedAt, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Catatan gagal ditambahkan.');
    }

    await this._cacheService.del(`notes:${owner}`);
    return result.rows[0].id;
  }

  async getNotes(owner) {
    try {
      const resultNoteFromCache = await this._cacheService.get(`notes:${owner}`);
      return JSON.parse(resultNoteFromCache);
    } catch (error) {
      const query = {
        text: `SELECT notes.* FROM
        notes LEFT JOIN collaborations ON collaborations.note_id = notes.id
        WHERE notes.owner=$1 OR collaborations.user_id=$1
        GROUP BY notes.id`,
        values: [owner],
      };
      const result = await this._pool.query(query);
      const mappedResult = result.rows.map(mapDBToModel);

      await this._cacheService.set({
        key: `notes:${owner}`,
        value: JSON.stringify(mappedResult),
      });
      return mappedResult;
    }
  }

  async getNoteById(id) {
    const query = {
      text: `SELECT notes.*, users.username FROM
      notes INNER JOIN users ON notes.owner = users.id
      WHERE notes.id = $1`,
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Catatan tidak ditemukan');
    }

    return result.rows.map(mapDBToModel)[0];
  }

  async editNoteById(id, {title, body, tags}) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE notes SET title=$1, body=$2, tags=$3, updated_at=$4 WHERE id=$5 RETURNING id, owner',
      values: [title, body, tags, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui catatan. Id tidak ditemukan');
    }

    await this._cacheService.del(`notes:${result.rows[0].owner}`);
  }

  async deleteNoteById(id) {
    const query = {
      text: 'DELETE FROM notes WHERE id=$1 RETURNING id, owner',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Catatan gagal dihapus. Id tidak ditemukan');
    }

    await this._cacheService.del(`notes:${result.rows[0].owner}`);
  }

  async verifyNoteOwner(id, owner) {
    const query = {
      text: 'SELECT owner FROM notes WHERE id=$1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Catatan tidak ditemukan');
    }

    if (result.rows[0].owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyNoteAccess(noteId, userId) {
    try {
      await this.verifyNoteOwner(noteId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      try {
        await this._collaborationsService.verifyCollaborator(noteId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = NotesService;
