/** @namespace application.app.services.MessageService **/
module.exports = function (application) {
    const MESSAGES_INDEX = 'messages';
    const INDEX_LIMIT = 10000;

    const Response = application.app.utils.Response;
    const ElasticsearchService = require('./ElasticsearchService');
    const MessageFactory = application.app.models.MessageFactory;

    return {
        async createMessage(message) {
            return new Promise(async (resolve, reject) => {
                try {
                    const { body } = await ElasticsearchService.getClient().index({
                        index: MESSAGES_INDEX,
                        body: message,
                        refresh: true
                    });
                    resolve(Response.success(body._id));
                } catch (err) {
                    console.error(err);
                    reject(Response.internalServerError(err));
                }
            });
        },

        async listIssueMessages(issueId) {
            return new Promise(async (resolve, reject) => {
                try {
                    const { body } = await ElasticsearchService.getClient().search({
                        index: MESSAGES_INDEX,
                        size: INDEX_LIMIT,
                        body: {
                            query: {
                                match: { issueId: issueId }
                            }
                        }
                    });

                    if (Object.keys(body.hits.hits).length === 0) {
                        reject(Response.notFound());
                    }
                    else {
                        resolve(Response.success(body.hits.hits.map(MessageFactory.fromHit)));
                    }

                } catch (err) {
                    console.error(err);
                    reject(Response.notFound());
                }
            });
        },

        async getMessageByIdLimit(params) {
            return new Promise(async (resolve, reject) => {
                try {
                    let mode = (params.order == "desc") ? "desc" : "asc";                

                    const { body } = await ElasticsearchService.getClient().search({
                        index: MESSAGES_INDEX,
                        size: params.limit,
                        from: params.skip,
                        body: {
                            query: {
                                match: { issueId: params.issueId }
                            },
                            sort: { creationDate: mode }
                        }
                    });

                    if (Object.keys(body.hits.hits).length === 0) {
                        reject(Response.notFound());
                    }
                    else {
                        resolve(Response.success(body.hits.hits.map(MessageFactory.fromHit)));
                    }

                } catch (err) {
                    console.error(err);
                    reject(Response.internalServerError(err));
                }
            });
        },

        async editTextMessage(id, text) {
            return new Promise(async (resolve, reject) => {
                try {
                    const { body } = await ElasticsearchService.getClient().update({
                        index: MESSAGES_INDEX,
                        id: id,
                        refresh: true,
                        body: {
                            doc: {
                                text: text
                            }
                        }
                    });
                    resolve(Response.success(body));
                } catch (err) {
                    console.error(err);
                    reject(Response.notFound());
                }
            });
        },

        async deleteMessage(messageId) {
            return new Promise(async (resolve, reject) => {
                try {
                    const { body } = await ElasticsearchService.getClient().delete({
                        index: MESSAGES_INDEX,
                        id: messageId,
                        refresh: true
                    });

                    resolve(Response.success(body));
                } catch (err) {
                    console.error(err);
                    reject(Response.notFound());
                }
            });
        },

        async deleteMessagesByIssue(issueId) {
            return new Promise(async (resolve, reject) => {
                try {
                    const { body } = await ElasticsearchService.getClient().deleteByQuery({
                        index: MESSAGES_INDEX,
                        refresh: true,
                        body: {
                            query: {
                                match: { issueId: issueId }
                            }
                        }
                    }, {
                        ignore: [404]
                    });

                    resolve(Response.success(body));
                } catch (err) {
                    console.error(err);
                    reject(Response.internalServerError(err));
                }
            });
        }
    };
};
