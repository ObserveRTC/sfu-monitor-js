// const ObserverEndpoint = require('../ObserverEndpoint');
import { Comlink } from "../Comlink";
import WS from "jest-websocket-mock";

describe("Connect to a server", () => {
  let server : WS;
  const makeClient = () => Comlink.builder()
    .withNoSsl()
    .withHost("localhost")
    .withServiceId("serviceId")
    .withMediaUnitId("mediaUnitId")
    .withPortNumber(1234)
    .build();

  beforeAll(() => {
    server = new WS("ws://localhost:1234/sfusamples/serviceId/mediaUnitId");
  });

  afterAll(() => {
    server.close();
    WS.clean();
  });

  test('comlink is connected', async () => {
    return new Promise((resolve) => {
        makeClient()
          .onConnected(() => resolve(undefined))
          .onError(console.error);
    });
  });
});


describe('Create Comlink', () => {
  test('cannot build without host', () => {
    const observerEndpoint = Comlink.builder()
      .withServiceId("serviceId")
      .withMediaUnitId("mediaUnitId");
  
      expect(observerEndpoint.build).toThrow(Error);
  });

  test('cannot build without serviceId', () => {
    const observerEndpoint = Comlink.builder()
      .withHost("localhost")
      .withMediaUnitId("mediaUnitId");
  
      expect(observerEndpoint.build).toThrow(Error);
  });

  test('cannot build without mediaUnitId', () => {
    const observerEndpoint = Comlink.builder()
      .withHost("localhost")
      .withServiceId("serviceId");
  
      expect(observerEndpoint.build).toThrow(Error);
  });
});
