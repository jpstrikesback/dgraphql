import fs from 'fs'
import path from 'path'

import { graphql } from 'graphql'
import { buildSchema } from '../schema'
import { connect } from '../dgraph'

const client = connect('http://localhost:8080')

function getSchema (options) {
  const file = path.resolve(__dirname, 'test.graphql')
  const input = fs.readFileSync(file).toString()
  return buildSchema(input, options)
}

const schema = getSchema({ relay: false })

beforeAll(async () => {
  let dgraphSchemaPath = path.resolve(__dirname, 'test.dgraph')
  await client.query(fs.readFileSync(dgraphSchemaPath).toString())
})

test('queries node field', async () => {
  const create = `mutation {
    createPerson(input: {
      name: "Tim"
    }) {
      person {
        id
      }
    }
  }`
  const createResult = await graphql(schema, create)
  const id = createResult.data.createPerson.person.id

  const query = `query {
    person(id: "${id}") {
      name
    }
  }`
  const queryResult = await graphql(schema, query)
  expect(queryResult).toMatchSnapshot()
})

test('queries node fields', async () => {
  const create = `mutation {
    createPerson(input: {
      name: "Tim",
      active: true
    }) {
      person {
        id
      }
    }
  }`
  const createResult = await graphql(schema, create)
  const id = createResult.data.createPerson.person.id

  const query = `query {
    person(id: "${id}") {
      name
      active
    }
  }`
  const queryResult = await graphql(schema, query)
  expect(queryResult).toMatchSnapshot()
})

test('queries aliased field', async () => {
  const create = `mutation {
    createPerson(input: {
      name: "Tim"
    }) {
      person {
        id
      }
    }
  }`
  const createResult = await graphql(schema, create)
  const id = createResult.data.createPerson.person.id

  const query = `query {
    person(id: "${id}") {
      test: name
    }
  }`
  const queryResult = await graphql(schema, query)
  expect(queryResult).toMatchSnapshot()
})

test('queries nested field', async () => {
  const create = `mutation {
    createPerson(input: {
      name: "Tim",
      partner: {
        name: "Bob"
      }
    }) {
      person {
        id
      }
    }
  }`
  const createResult = await graphql(schema, create)
  const id = createResult.data.createPerson.person.id

  const query = `query {
    person(id: "${id}") {
      name
      partner {
        name
      }
    }
  }`
  const queryResult = await graphql(schema, query)
  expect(queryResult).toMatchSnapshot()
})

describe('querying edges', () => {
  let time = 0
  beforeAll(() => {
    time = String(new Date().getTime() - 1495660000000)
    const create = `mutation {
      aaron: createPerson(input: {
        name: "Aaron Whitman",
        active: true,
        age:20,
        time: ${time}
      }) {
        person { id }
      }
      bobby: createPerson(input: {
        name: "Bobby Whitman",
        active: false,
        age: 16,
        time: ${time}
      }) {
        person { id }
      }
      catherine: createPerson(input: {
        name: "Catherine Harrison",
        active: true,
        age: 19,
        time: ${time}
      }) {
        person { id }
      }
    }`
    return graphql(schema, create)
  })
  test('order edges by string ascending', async () => {
    const query = `query {
      people(
        order: name_asc,
        filter: {
          time_eq: ${time}
        }
      ) {
        name
      }
    }`
    const queryResult = await graphql(schema, query)
    expect(queryResult).toMatchSnapshot()
  })
  test('order edges by string descending', async () => {
    const query = `query {
      people(
        order: name_desc,
        filter: {
          time_eq: ${time}
        }
      ) {
        name
      }
    }`
    const queryResult = await graphql(schema, query)
    expect(queryResult).toMatchSnapshot()
  })
  test('filters by string with all terms', async () => {
    const query = `query {
      people(
        order: name_asc,
        filter: {
          time_eq: ${time},
          name_allOf: "Aaron Whitman"
        }
      ) {
        name
      }
    }`
    const queryResult = await graphql(schema, query)
    expect(queryResult).toMatchSnapshot()
  })
  test('filters by string with any of terms', async () => {
    const query = `query {
      people(
        order: name_asc,
        filter: {
          time_eq: ${time},
          name_anyOf: "Aaron Catherine"
        }
      ) {
        name
      }
    }`
    const queryResult = await graphql(schema, query)
    expect(queryResult).toMatchSnapshot()
  })
  test('filters by string equal to', async () => {
    const query = `query {
      people(
        order: name_asc,
        filter: {
          time_eq: ${time},
          name_eq: "Catherine Harrison"
        }
      ) {
        name
      }
    }`
    const queryResult = await graphql(schema, query)
    expect(queryResult).toMatchSnapshot()
  })
  test('filters by int equal to', async () => {
    const query = `query {
      people(
        order: age_asc,
        filter: {
          time_eq: ${time},
          age_eq: 19
        }
      ) {
        name
        age
      }
    }`
    const queryResult = await graphql(schema, query)
    expect(queryResult).toMatchSnapshot()
  })
  test('filters by int less than', async () => {
    const query = `query {
      people(
        order: age_asc,
        filter: {
          time_eq: ${time},
          age_lt: 19
        }
      ) {
        name
        age
      }
    }`
    const queryResult = await graphql(schema, query)
    expect(queryResult).toMatchSnapshot()
  })
  test('filters by int less than or equal to', async () => {
    const query = `query {
      people(
        order: age_asc,
        filter: {
          time_eq: ${time},
          age_le: 19
        }
      ) {
        name
        age
      }
    }`
    const queryResult = await graphql(schema, query)
    expect(queryResult).toMatchSnapshot()
  })
  test('filters by int greater than to', async () => {
    const query = `query {
      people(
        order: age_asc,
        filter: {
          time_eq: ${time},
          age_gt: 19
        }
      ) {
        name
        age
      }
    }`
    const queryResult = await graphql(schema, query)
    expect(queryResult).toMatchSnapshot()
  })
  test('filters by int greater than or equal to', async () => {
    const query = `query {
      people(
        order: age_asc,
        filter: {
          time_eq: ${time},
          age_ge: 19
        }
      ) {
        name
        age
      }
    }`
    const queryResult = await graphql(schema, query)
    expect(queryResult).toMatchSnapshot()
  })
})
