var supertest = require('supertest')
const { Kafka } = require('kafkajs')

const {
  KAFKA_HOST,
  KAFKA_TOPIC,
  TEST_URL
} = process.env

const kafka = new Kafka({
  clientId: 'my-app-test',
  ssl: false,
  brokers: [KAFKA_HOST]
})

const consumer = kafka.consumer({ groupId: 'forager-test-runner' })

describe('Testing the tester', () => {


  beforeAll(async () => {
    jest.useFakeTimers()

    await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: true })

    await consumer.connect()

  })

  afterAll(async () => {
    await consumer.disconnect()

  })

  it('should return a status code of 200 and the body should have the correct structure', async () => {
    let expectedMessage
    await supertest(TEST_URL)
      .get(`/`)
      // .expect('Content-Type', /json/)
      // .expect(200)
      .then(() => {
        console.log("HERE")
        // expect(typeof resp.body).toEqual('object')
        setTimeout(async () => {
          await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
              console.log("CONSUMER VALUE", {
                value: message.value.toString(),
              })
              expectedMessage = message.value.toString()
            },
          })
          console.log("Expected", expectedMessage)
          expect(expectedMessage).toBe('Hello KafkaJS user!')
        }, 5000)
      })
  })
});