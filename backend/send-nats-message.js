// eslint-disable-next-line @typescript-eslint/no-var-requires
const { connect, StringCodec } = require('nats');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4 } = require('uuid');

function rand(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function randomBinary(min, max) {
  return Math.floor(min + Math.random() * (max + 1 - min)).toString(2);
}

function randomExistingUuid() {
  const uuids = [
    '0762a81c-99bb-11ee-9a06-325096b39f47',
    '0762aa92-99bb-11ee-94e3-325096b39f47',
    '0762ab28-99bb-11ee-9860-325096b39f47',
    '0762aba0-99bb-11ee-0762a81c-99bb-11ee-9a06-325096b39f47',
    '0762aa92-99bb-11ee-94e3-325096b39f47',
    '0762ab28-99bb-11ee-9860-325096b39f47',
    '0762aba0-99bb-11ee-a774-325096b39f47',
    '0762abfa-99bb-11ee-b4c3-325096b39f47',
    '0762ac68-99bb-11ee-8b28-325096b39f47',
    '0762accc-99bb-11ee-9982-325096b39f47',
    '0762ad58-99bb-11ee-8877-325096b39f47',
    '0762adb2-99bb-11ee-bead-325096b39f47',
    '0762ae20-99bb-11ee-b4f3-325096b39f47a774-325096b39f47',
    '0762abfa-99bb-11ee-b4c3-325096b39f47',
    '0762ac68-99bb-11ee-8b28-325096b39f47',
    '0762accc-99bb-11ee-9982-325096b39f47',
    '0762ad58-99bb-11ee-8877-325096b39f47',
    '0762adb2-99bb-11ee-bead-325096b39f47',
    '0762ae20-99bb-11ee-b4f3-325096b39f47',
  ];
  return uuids[rand(0, uuids.length - 1)];
}

async function createNats() {
  // to create a connection to a nats-server:
  const nc = await connect({ servers: 'localhost:4222' });

  // create a codec
  const sc = StringCodec();

  return {
    sendRandomNatsMessage() {
      const startDay = rand(1, 31);
      const endDay = rand(Math.max(1, startDay - 1), 31);
      const startHour = rand(0, 23);
      const endHour = rand(startHour, 23);

      const payload = {
        start: new Date(
          `2023-12-${startDay.toString().padStart(2, '0')}T${startHour
            .toString()
            .padStart(2, '0')}:00:00Z`,
        ),
        end: new Date(
          `2023-12-${endDay.toString().padStart(2, '0')}T${endHour
            .toString()
            .padStart(2, '0')}:00:00Z`,
        ),
        reference: [() => v4().toString(), () => randomExistingUuid()][
          randomBinary(0, 1)
        ](),
        // booked | cancelled
        status: ['booked', 'cancelled'][randomBinary(0, 1)],
        item: {
          name: 'Visite du louvre',
        },
        customer: {
          firstname: 'Black',
          lastname: 'Widow',
          phone: '+336' + rand(10000000, 99999999),
        },
        guides: [
          { firstname: 'Chuck', lastname: 'Norris', email: 'chuck@norris.com' },
          {
            firstname: 'Captain',
            lastname: 'America',
            email: 'captain@america.com',
          },
        ],
      };

      nc.publish(
        `events.order.booking.${payload.status}`,
        sc.encode(JSON.stringify(payload)),
      );
    },
    async close() {
      // we want to insure that messages that are in flight
      // get processed, so we are going to drain the
      // connection. Drain is the same as close, but makes
      // sure that all messages in flight get seen
      // by the iterator. After calling drain on the connection
      // the connection closes.
      await nc.drain();
    },
  };
}

async function runStandalone() {
  // console.log('Sending random message to NATS');
  const nts = await createNats();
  nts.sendRandomNatsMessage();
  await nts.close();
}

let nts = null;
async function createNatsConn() {
  nts = await createNats();
}
async function sendRandomNatsMessage() {
  nts.sendRandomNatsMessage();
}
async function closeNatsConn() {
  await nts.close();
}

module.exports = {
  runStandalone,
  createNatsConn,
  sendRandomNatsMessage,
  closeNatsConn,
};
