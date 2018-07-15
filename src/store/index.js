import { createStore, applyMiddleware } from 'redux'
import promiseMiddleware from 'redux-promise'
import rootReducer from './reducers'

// 创建全局 store
export default function configStore () {
  return createStore(rootReducer, applyMiddleware(promiseMiddleware))
}
