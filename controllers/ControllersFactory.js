import { BaseRepository } from "../db/index";
import { BaseRepositoryPG } from "../db/index";
import { Avaliacao, Empresa, Cliente, Estabelecimento } from '.';

export default class ControllersFactory {
	constructor(app, jwtsecret, mongo, pg) {

	}

	postControllers(url) {
        if(/^\/estabelecimentos/.test(url))
            return (async (params, query) => {
                let email_empresa = params.email;
                return await Estabelecimento.getByEmpresa(email_empresa);
            });

        if(/^(\/avaliacoes)/.test(url))
            return (async (params, query) =>
                    await Avaliacao.getByEmailEstabelecimento(params.email));

		return this.notFound;
	}

	getControllers(url) {
        if(/^(\/empresas)$/.test(url))
            return (async (params, query) => (await Empresa.getAll()));




        return this.notFound;
	}

	putControllers(url) {
		return this.notFound;
	}

	deleteControllers(url) {
		return this.notFound;
	}

	notFound() {
		return 404;
	}
}
