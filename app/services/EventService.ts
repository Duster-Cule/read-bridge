import Emittery from 'emittery'

export const EventEmitter = new Emittery()

export const EVENT_NAMES = {
  SEND_LINE_INDEX: 'SEND_LINE_INDEX',
  SEND_MESSAGE: 'SEND_MESSAGE',
  RECEIVE_MESSAGE: 'RECEIVE_MESSAGE'
}

