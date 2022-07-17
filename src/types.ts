export enum Header {
  CLIENT = "MDPC01",
  WORKER = "MDPW01",
}

export enum Message {
  READY = "\x01",
  REQUEST = "\x02",
  REPLY = "\x03",
  HEARTBEAT = "\x04",
  DISCONNECT = "\x05",
}