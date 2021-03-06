const PGConnection = require('../../db/PGConnection.js');
import { EncryptionUtility } from '../../helper';

export default class Estabelecimento {
    static async getByEmail(email, token) {
        const validation = EncryptionUtility.validateToken(token, 'frangos');
        if (validation.error) return ({success:false, error: 'token invalido'});

        let query_estabelecimento = "SELECT * FROM inline.estabelecimento WHERE email = $1";
        let query_enderecos = "SELECT * FROM inline.endereco WHERE id = $1";
        let query_hora_dia = "SELECT * FROM inline.hora_dia_funcionamento WHERE email_estabelecimento = $1";
        let estabelecimento = (await PGConnection.query(query_estabelecimento,
                                                        [email])).rows[0];
        if (estabelecimento) {
            estabelecimento.endereco = (await PGConnection.query(query_enderecos, [estabelecimento.id_endereco])).rows[0];
            estabelecimento.hora_dia = (await PGConnection.query(query_hora_dia, [estabelecimento.email_estabelecimento])).rows;
        }
        return {success: true, answer: estabelecimento};
    }

    static async getByEmpresa(email_empresa, token) {
      const validation = EncryptionUtility.validateToken(token, 'frangos');
      if (validation.error) return ({success:false, error: 'token invalido'});
      const { nome, email, celular, prioridade, senha } = validation.decoded;

      let query_estabelecimentos = "SELECT * FROM inline.estabelecimento NATURAL JOIN inline.usuario INNER JOIN inline.endereco ON estabelecimento.id_endereco = endereco.id WHERE email_empresa=$1";
      let estabelecimentos = (await PGConnection.query(query_estabelecimentos, [email_empresa])).rows;
      return {success: true, answer: estabelecimentos};
    }

    static async insert(nome, email, email_empresa, endereco, posicao_gps, senha, cnpj, token) {
        const validation = EncryptionUtility.validateToken(token, 'frangos');
        if (validation.error) return ({success:false, error: 'token invalido'});
        let array_endereco = []

        array_endereco.push(endereco.estado);
        array_endereco.push(endereco.cidade);
        array_endereco.push(endereco.logradouro);
        array_endereco.push(endereco.numero);
        array_endereco.push(endereco.complemento);

        let encrypted = EncryptionUtility.hash(senha);
        let query_usuario = "INSERT INTO inline.usuario(nome, tipo, email, senha) VALUES ($1, 'estabelecimento', $2, $3)";
        let query_estabelecimento = "INSERT INTO inline.estabelecimento(email, email_empresa, id_endereco, posicao_gps) VALUES ($1, $2, $3, $4)";
        let query_endereco = "INSERT INTO inline.endereco(estado, cidade, logradouro, numero, complemento) VALUES ($1, $2, $3, $4, $5)";
        let query_get_endereco = "SELECT id FROM inline.endereco WHERE estado = $1 AND cidade = $2 AND logradouro = $3 AND numero = $4 AND complemento = $5";
        let Conn = (await PGConnection.newConnection());

        try {
            await Conn.query('BEGIN');
            await Conn.query(query_usuario, [nome, email, encrypted]);
            let end = await Conn.query(query_get_endereco, array_endereco);
            if (end.rows.length == 0) {
                await Conn.query(query_endereco, array_endereco);
                end = await Conn.query(query_get_endereco, array_endereco);
            }
            await Conn.query(query_estabelecimento, [email, email_empresa, end.rows[0].id, posicao_gps]);
            await Conn.query('COMMIT');
            await Conn.end();
        } catch (e) {
            await Conn.query('ROLLBACK');
            await Conn.end();
            return {success: false, error: e};
        }
        return  {success: true};
    }
}
