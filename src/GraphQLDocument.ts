import * as mongoose from 'mongoose';
import createGraphQLType from 'mongoose-schema-to-graphql';
import { TGraphQLDocumentOptions, TGraphQLDefinitions } from '../types';

const defaultOptions: TGraphQLDocumentOptions = {
  schema: {},
  typeOptions: {
    class: 'GraphQLObjectType',
    exclude: /^__/
  }
};

export default class GraphQLDocument {
  schema: mongoose.Schema;
  Model: Object;
  type: Object;
  queries: Object;
  mutations: Object;
  subscriptions: Object;

  constructor(options: TGraphQLDocumentOptions) {
    const documentOptions: TGraphQLDocumentOptions = { ...defaultOptions, ...options };
    const {
      name,
      description,
      schema: schemaDefinition,
      enhanceSchema,
      typeOptions,
      queries,
      mutations,
      subscriptions
    } = documentOptions;

    /* Create mongoose schema */
    this.schema = new mongoose.Schema(schemaDefinition);

    /* (Optional) Enhance the created Schema */
    if (enhanceSchema) {
      enhanceSchema(this.schema);
    }

    /* Create mongoose model */
    this.Model = mongoose.model(name, this.schema);

    /* Create GraphQL type from the mongoose schema */
    this.type = createGraphQLType({
      name,
      description,
      class: typeOptions.class,
      schema: this.schema,
      exclude: typeOptions.exclude
    });

    /* Append GraphQL definitions */
    if (queries) this.queries = this.appendGraphQLDefinitions(queries);
    if (mutations) this.mutations = this.appendGraphQLDefinitions(mutations);
    if (subscriptions) this.subscriptions = this.appendGraphQLDefinitions(subscriptions);

    return this;
  }

  /**
   * Append dynamic GraphQL definitions (queries/mutations/subscriptions) Object
   * to the created GraphQLDocument.
   */
  appendGraphQLDefinitions(definitions: TGraphQLDefinitions): Object {
    return Object.keys(definitions).reduce((allDefinitions, definitionName) => {
      const getQuery = definitions[definitionName];

      allDefinitions[definitionName] = getQuery({
        type: this.type,
        schema: this.schema,
        Model: this.Model
      });

      return allDefinitions;
    }, {})
  }
}
